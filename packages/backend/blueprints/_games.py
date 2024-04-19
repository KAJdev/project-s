from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Message, Player, Game, User
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
    game = await Game.find(Game.players == request.ctx.user.id).to_list(None)
    return json([g.dict() for g in game])


@bp.route("/v1/games", methods=["POST"])
@authorized()
@openapi.operation("Create a game")
@openapi.description("Create a game")
async def create_game(request: Request):
    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    if not all(data.get(k) for k in ("players", "name")):
        raise exceptions.BadRequest("Bad Request")

    players = data["players"]
    players.append(request.ctx.user.id)

    game = Game(
        name=data["name"],
        players=players,
        created_at=datetime.now(UTC),
    )

    await game.save()
    return json(game.dict())
