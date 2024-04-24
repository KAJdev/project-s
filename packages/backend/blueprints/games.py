from datetime import datetime, UTC
import random
from beanie import WriteRules
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Carrier, GameSettings, Message, Player, Game, Star, distance
from modules.auth import authorized
from modules import gateway
from modules.worldgen import generate_star_name, generate_star_positions
from beanie.operators import Or

from blueprints.scan import on_scan

MSG_PAGE_SIZE = 100

bp = Blueprint("games")


async def generate_map(game: Game):
    normal_stars, player_stars = generate_star_positions(
        player_count=game.settings.max_players,
        stars_per_player=game.settings.stars_per_player,
    )

    stars: list[Star] = []

    for member, position in zip(game.members, player_stars):
        stars.append(
            Star(
                position=position,
                name=generate_star_name(),
                game=game.id,
                occupier=member.id,
                resources=50,
                ships=game.settings.starting_ships,
                economy=game.settings.starting_economy,
                industry=game.settings.starting_industry,
                science=game.settings.starting_science,
            )
        )

        # now add some stars for each player that are the nearest normal stars
        for i in range(game.settings.starting_stars - 1):
            closest_star = min(
                normal_stars,
                key=lambda star: distance((star.x, star.y), (position.x, position.y)),
            )

            stars.append(
                Star(
                    position=closest_star,
                    name=generate_star_name(),
                    game=game.id,
                    occupier=member.id,
                    resources=random.randint(1, 50),
                    ships=game.settings.starting_ships,
                )
            )

            normal_stars.remove(closest_star)

    # now add the rest of the normal stars
    for star in normal_stars:
        stars.append(
            Star(
                position=star,
                name=generate_star_name(),
                game=game.id,
                resources=random.randint(1, 50),
            )
        )

    await Star.insert_many(stars)


@bp.route("/v1/games", methods=["GET"])
@authorized()
@openapi.operation("Get your games")
@openapi.description("Get your games")
async def get_games(request: Request):
    games = await Game.find(
        Or(Game.members.user == request.ctx.user.id, Game.owner == request.ctx.user.id),
        fetch_links=True,
    ).to_list(None)
    return json([g.dict() for g in games])


@bp.route("/v1/games/<game_id>", methods=["GET"])
@authorized()
@openapi.parameter("p", str)
@openapi.operation("Get a specific game")
@openapi.description("Get a specific game")
async def get_game(request: Request, game_id: str):
    password = request.args.get("p", None)

    game = await Game.find_one(
        Game.id == game_id,
        Or(Game.password == password, Game.password == None),
        fetch_links=True,
    )

    if not game:
        raise exceptions.NotFound("Game not found")

    return json(game.dict())


@bp.route("/v1/games/<game_id>/join", methods=["POST"])
@authorized()
@openapi.operation("Join a game")
@openapi.description("Join a game")
async def join_game(request: Request, game_id: str):
    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    password = request.args.get("p", None)
    player_name = data.get("name")
    player_color = data.get("color")

    game = await Game.find_one(
        Game.id == game_id,
        Or(Game.password == password, Game.password == None),
        fetch_links=True,
    )
    if not game:
        raise exceptions.NotFound("Game not found")

    if game.password and game.password != password:
        raise exceptions.BadRequest("Incorrect password")

    if len(game.members) >= game.settings.max_players:
        raise exceptions.BadRequest("Game is full")

    if any(player.user == request.ctx.user.id for player in game.members):
        raise exceptions.BadRequest("You are already in this game")

    if any(player.name == player_name for player in game.members):
        raise exceptions.BadRequest("Name already taken")

    if any(player.color == player_color for player in game.members):
        raise exceptions.BadRequest("Color already taken")

    new_player = Player(
        name=player_name,
        color=player_color,
        game=game.id,
        user=request.ctx.user.id,
        cash=game.settings.starting_cash,
    )

    game.members.append(new_player)
    await game.save(link_rule=WriteRules.WRITE)

    return json(game.dict())


@bp.route("/v1/games", methods=["POST"])
@authorized()
@openapi.operation("Create a game")
@openapi.description("Create a game")
async def create_game(request: Request):
    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    name = data.get("name")
    settings = data.get("settings")

    if not name:
        raise exceptions.BadRequest("Name is required")

    if not settings:
        raise exceptions.BadRequest("Settings are required")

    try:
        settings = GameSettings.model_construct(**settings)
    except Exception as e:
        raise exceptions.BadRequest(f"Invalid settings: {e}")

    game = Game(
        name=data["name"],
        created_at=datetime.now(UTC),
        owner=request.ctx.user.id,
        settings=settings,
    )

    await game.save()
    return json(game.dict())


@bp.route("/v1/games/<game_id>/start", methods=["POST"])
@authorized()
@openapi.operation("Start a game")
@openapi.description("Start a game")
async def start_game(request: Request, game_id: str):
    game = await Game.get(game_id, fetch_links=True)
    if not game:
        raise exceptions.NotFound("Game not found")

    if game.owner != request.ctx.user.id:
        raise exceptions.Forbidden("You do not own this game")

    if game.started_at:
        raise exceptions.BadRequest("Game already started")

    game.started_at = datetime.now(UTC)
    await game.save()
    await generate_map(game)

    return json(game.dict())


@bp.route("/v1/games/<game_id>/restart", methods=["POST"])
@authorized()
@openapi.exclude()
async def restart_game(request: Request, game_id: str):
    game = await Game.get(game_id, fetch_links=True)
    if not game:
        raise exceptions.NotFound("Game not found")

    if game.owner != request.ctx.user.id:
        raise exceptions.Forbidden("You do not own this game")

    if not game.started_at:
        raise exceptions.BadRequest("Game not yet started")

    game.started_at = datetime.now(UTC)
    game.winner = None
    await Star.find(Star.game == game.id).delete_many()
    await Message.find(Message.game == game.id).delete_many()
    await Carrier.find(Carrier.game == game.id).delete_many()
    await Player.find(Player.game == game.id).update_many(
        {"$set": {"cash": game.settings.starting_cash}}
    )
    await game.save()
    await generate_map(game)
    on_scan(game)

    return json(game.dict())
