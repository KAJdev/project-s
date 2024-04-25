import asyncio
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import (
    Destination,
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

    try:
        destinations = list(Destination(**destination) for destination in destinations)
    except TypeError:
        raise exceptions.BadRequest("Bad Request")

    if name:
        carrier.name = name

    if destinations:
        if (
            carrier.destination_queue
            and carrier.destination_queue[0].star != destinations[0].star
        ):
            raise exceptions.BadRequest("Bad Request")

        all_stars = await Star.find(
            Star.game == game.id, In(Star.id, [d.star for d in destinations])
        ).to_list(None)
        last_position = (
            carrier.position
            if not carrier.destination_queue
            else next(
                (
                    star
                    for star in all_stars
                    if star.id == carrier.destination_queue[0].star
                ),
                None,
            ).position
        )
        for destination in destinations:
            star = next(
                (star for star in all_stars if star.id == destination.star), None
            )
            if not star:
                raise exceptions.BadRequest("Bad Request")

            if (
                distance(last_position, star.position)
                > player.get_hyperspace_distance()
            ):
                raise exceptions.BadRequest("Bad Request")

            last_position = star.position

        carrier.destination_queue = destinations

    await carrier.save_changes()
    return json(carrier.dict())


async def carrier_tick(game: Game, stars: list[Star], hourly=False):
    carriers = await Carrier.find(Carrier.game == game.id).to_list(None)

    tasks = []
    for carrier in carriers:
        await carrier.move(game, stars)
        tasks.append(carrier.save_changes())

    await asyncio.gather(*tasks)

    # fight me bitch
    for star in stars:
        # get all the carriers within fighting distance (say 0.01 LY)
        close_carriers = [
            c for c in carriers if distance(c.position, star.position) < 0.01
        ]

        defending_carriers = [c for c in close_carriers if c.owner == star.occupier]
        attacking_carriers = [c for c in close_carriers if c.owner != star.occupier]

        if len(attacking_carriers) <= 0:
            # it's quiet. Tooo quiet.
            continue

        defending_ships = star.ships + sum(
            [c.ships for c in close_carriers if c.owner == star.occupier]
        )
        attacking_ships = sum(
            [c.ships for c in close_carriers if c.owner != star.occupier]
        )

        try:
            defending_weapons = next(
                p.research_levels.weapons for p in game.members if p.id == star.occupier
            )
        except StopIteration:
            defending_weapons = 0

        try:
            attacking_weapons = max(
                p.research_levels.weapons
                for p in game.members
                if p.id in [c.owner for c in attacking_carriers]
            )
        except ValueError:
            attacking_weapons = 0  # this should never happen but I am a good little programmer and I am handling it anyway

        winner = None
        attackers_win = False

        og_defending_ships = defending_ships
        og_attacking_ships = attacking_ships

        while True:
            if star.occupier:
                attacking_ships -= defending_weapons + 1

            if attacking_ships <= 0:
                attacking_ships = 0
                winner = star.occupier
                break

            defending_ships -= attacking_weapons

            if defending_ships <= 0:
                defending_ships = 0
                winner = next(c.owner for c in attacking_carriers)
                attackers_win = True
                break

        # yield the spoils of war!!
        if attackers_win:
            star.occupier = winner
            star.ships = 0
            star.ship_accum = 0

            # give the winner star.economy * 10 cash
            if star.economy > 0:
                winner_player = next(p for p in game.members if p.id == winner)
                await winner_player.inc({Player.cash: star.economy * 10})

            # your pillaging has consequences
            star.economy = 0

            casualties = og_attacking_ships - attacking_ships

            if casualties > 0:
                for i in range(casualties):
                    attacking_carriers[i % len(attacking_carriers)].ships -= 1
                    if attacking_carriers[i % len(attacking_carriers)].ships <= 0:
                        await attacking_carriers[i % len(attacking_carriers)].delete()
                        attacking_carriers.pop(i % len(attacking_carriers))

                tasks = []
                for c in attacking_carriers:
                    tasks.append(c.save_changes())
                await asyncio.gather(*tasks)

            # now nuke the losers
            await star.save_changes()
            if len(defending_carriers) > 0:
                await Carrier.find(
                    Carrier.game == game.id,
                    In(Carrier.id, [c.id for c in defending_carriers]),
                ).delete_many()
        else:
            # the defenders win, but at what cost?
            casualties = og_defending_ships - defending_ships

            if casualties > 0:
                for i in range(casualties):
                    if len(defending_carriers) <= 0:
                        star.ships -= 1
                    defending_carriers[i % len(defending_carriers)].ships -= 1
                    if defending_carriers[i % len(defending_carriers)].ships <= 0:
                        await defending_carriers[i % len(defending_carriers)].delete()
                        defending_carriers.pop(i % len(defending_carriers))

                if len(defending_carriers) > 0:
                    tasks = []
                    for c in defending_carriers:
                        tasks.append(c.save())
                    await asyncio.gather(*tasks)

            await star.save()

            # the attackers lose lol rip
            await Carrier.find(
                Carrier.game == game.id,
                In(Carrier.id, [c.id for c in attacking_carriers]),
            ).delete_many()
