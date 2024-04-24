from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import (
    GameSettings,
    Message,
    Player,
    Game,
    Star,
    User,
    Carrier,
    distance,
)
from modules.auth import authorized
from modules import gateway
from modules.worldgen import (
    generate_carrier_name,
)
from beanie.operators import Or, And, In

bp = Blueprint("carriers")


@bp.route("/v1/games/<game_id>/carriers", methods=["POST"])
@authorized()
@openapi.operation("Build a carrier")
@openapi.description("Build a carrier at a star")
async def build_carrier(request: Request, game_id: str):
    game = await Game.get(game_id, fetch_links=True)
    if not game:
        raise exceptions.NotFound("Game not found")

    if not game.started_at:
        raise exceptions.BadRequest("Game not yet started")

    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    star_id = data.get("star_id")
    name = data.get("name", None)
    ships = data.get("ships", 1)

    if not star_id or ships < 1:
        raise exceptions.BadRequest("Bad Request")

    star = await Star.get(star_id)
    if not star:
        raise exceptions.BadRequest("Bad Request")

    player = await Player.find_one(
        Player.game == game.id, Player.user == request.ctx.user.id
    )
    if not player:
        raise exceptions.BadRequest("Bad Request")

    if not star.occupier == player.id or star.ships < ships:
        raise exceptions.BadRequest("Bad Request")

    if player.cash < 25:
        raise exceptions.BadRequest("Bad Request")

    if not name:
        name = generate_carrier_name(int(player.color.replace("#", ""), 16))

    await player.inc({Player.cash: -25})

    carrier = Carrier(
        game=game.id,
        ships=ships,
        destination_queue=[],
        name=name,
        owner=player.id,
        position=star.position,
    )

    await carrier.save()
    await star.inc({Star.ships: -ships})

    return json(carrier.dict())


@bp.route("/v1/games/<game_id>/transfer", methods=["PATCH"])
@authorized()
@openapi.operation("Transfer ships between carriers or stars")
@openapi.description("Transfer ships between carriers or stars")
async def transfer_ships(request: Request, game_id: str):
    player = await Player.find_one(
        Player.game == game_id, Player.user == request.ctx.user.id
    )

    if not player:
        raise exceptions.BadRequest("Bad Request")

    game = await Game.get(game_id, fetch_links=True)
    if not game:
        raise exceptions.NotFound("Game not found")

    if not game.started_at:
        raise exceptions.BadRequest("Game not yet started")

    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    from_id = data.get("from_id")
    to_id = data.get("to_id")
    amount = data.get("amount")

    if not from_id or not to_id or from_id == to_id or not amount:
        raise exceptions.BadRequest("Bad Request")

    carriers = await Carrier.find(
        And(Carrier.game == game.id, Or(Carrier.id == from_id, Carrier.id == to_id))
    ).to_list(None)
    stars = await Star.find(
        And(Star.game == game.id, Or(Star.id == from_id, Star.id == to_id))
    ).to_list(None)
    entities = carriers + stars

    if not all(
        player.id
        == (getattr(entity, "occupier", None) or getattr(entity, "owner", None))
        for entity in entities
    ):
        raise exceptions.BadRequest("Bad Request")

    from_entity = next((entity for entity in entities if entity.id == from_id), None)
    to_entity = next((entity for entity in entities if entity.id == to_id), None)

    if not from_entity or not to_entity:
        raise exceptions.BadRequest("Bad Request")

    if amount > from_entity.ships or amount < 1:
        raise exceptions.BadRequest("Bad Request")

    # always keep at least one ship on a carrier
    if isinstance(from_entity, Carrier) and amount >= from_entity.ships:
        raise exceptions.BadRequest("Bad Request")

    # make sure they are close enough together
    if distance(from_entity.position, to_entity.position) > 0.2:
        raise exceptions.BadRequest("Bad Request")

    from_entity.ships -= amount
    to_entity.ships += amount
    await from_entity.inc({from_entity.__class__.ships: -amount})
    await to_entity.inc({to_entity.__class__.ships: amount})

    return json({"success": True})


@bp.route("/v1/games/<game_id>/carriers/<carrier_id>", methods=["PATCH"])
@authorized()
@openapi.operation("Rename a carrier or set its destination")
@openapi.description(" Rename a carrier or set its destination")
async def control_carrier(request: Request, game_id: str, carrier_id: str):
    game = await Game.get(game_id, fetch_links=True)
    if not game:
        raise exceptions.NotFound("Game not found")

    if not game.started_at:
        raise exceptions.BadRequest("Game not yet started")

    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    carrier = await Carrier.get(carrier_id)
    if not carrier:
        raise exceptions.NotFound("Carrier not found")

    player = await Player.find_one(
        Player.game == game.id, Player.user == request.ctx.user.id
    )
    if not player:
        raise exceptions.BadRequest("Bad Request")

    if not carrier.owner == player.id:
        raise exceptions.BadRequest("Bad Request")

    name = data.get("name", None)
    destinations = data.get("destinations", None)

    if name:
        carrier.name = name

    if destinations:
        if (
            carrier.destination_queue
            and carrier.destination_queue[0] != destinations[0]
        ):
            raise exceptions.BadRequest("Bad Request")

        all_stars = await Star.find(
            Star.game == game.id, In(Star.id, destinations)
        ).to_list(None)
        last_position = (
            carrier.position
            if not carrier.destination_queue
            else next(
                (star for star in all_stars if star.id == carrier.destination_queue[0]),
                None,
            ).position
        )
        for destination in destinations:
            star = next((star for star in all_stars if star.id == destination), None)
            if not star:
                raise exceptions.BadRequest("Bad Request")

            if (
                distance(last_position, star.position)
                > player.get_hyperspace_distance()
            ):
                raise exceptions.BadRequest("Bad Request")

            last_position = star.position

        carrier.destination_queue = destinations

    await carrier.save()
    return json(carrier.dict())


async def carrier_tick(game: Game, stars: list[Star], hourly=False):
    carriers = await Carrier.find(Carrier.game == game.id).to_list(None)

    for carrier in carriers:
        carrier.move(game, stars)
        await carrier.save()
