from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import GameSettings, Message, Player, Game, User
from modules.auth import authorized
from modules import gateway
from beanie.operators import Or, And, In

MSG_PAGE_SIZE = 100

bp = Blueprint("games")


@bp.route("/v1/games", methods=["GET"])
@authorized()
@openapi.operation("Get your games")
@openapi.description("Get your games")
async def get_messages(request: Request):
    game = await Game.find(
        Or(Game.members == request.ctx.user.id, Game.owner == request.ctx.user.id)
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
