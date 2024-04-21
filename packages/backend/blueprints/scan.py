from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Carrier, GameSettings, Message, Player, Game, Star, User
from modules.auth import authorized
from modules import gateway
from beanie.operators import Or, And, In
from typing import TypedDict

MSG_PAGE_SIZE = 100

bp = Blueprint("scan")


class ScanResponse(TypedDict):
    players: list[Player]
    stars: list[Star]
    carriers: list[Carrier]


@bp.route("/v1/games/<game_id>/scan", methods=["GET"])
@authorized()
@openapi.operation("Poll a game for changes in state")
@openapi.description("Poll a game for changes in state")
async def get_scan(request: Request):
    scan: ScanResponse = {
        "players": [],
        "stars": [],
        "carriers": [],
    }

    scan["players"] = await Player.find(Player.game == request.ctx.game.id).to_list(
        None
    )
    scan["stars"] = await Star.find(Star.game == request.ctx.game.id).to_list(None)
    scan["carriers"] = await Carrier.find(Carrier.game == request.ctx.game.id).to_list(
        None
    )

    player_stars = [
        star for star in scan["stars"] if star.occupier == request.ctx.user.id
    ]

    for carrier in scan["carriers"]:
        pass
        # TODO: check to make sure the carrier is within scanning range of a star the player owns

    game = await Game.find(
        Or(Game.members == request.ctx.user.id, Game.owner == request.ctx.user.id),
        fetch_links=True,
    ).to_list(None)
    return json([g.dict() for g in game])


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
