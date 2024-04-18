from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Message, Player, Game, User
from modules.auth import authorized
from modules import gateway
from beanie.operators import Or, And, In

MSG_PAGE_SIZE = 100

bp = Blueprint("messages")


@bp.route("/v1/messages/<game_id>/<player_id>", methods=["GET"])
@authorized()
@openapi.operation("Get messages in a channel")
@openapi.description("Get messages in a channel")
async def get_messages(request: Request, game_id: str, player_id: str):
    members = (
        [request.ctx.user.id]
        if player_id == "global"
        else [request.ctx.user.id, player_id]
    )

    game = await Game.find_one(Game.id == game_id, In(Game.players, members))
    if not game:
        raise exceptions.NotFound("Player or Game not found")

    before = request.args.get("before", None)
    date = datetime.fromisoformat(before.strip("Z")) if before else None

    msgs = (
        await Message.find(
            (
                Message.game == game_id
                if player_id == "global"
                else And(
                    Message.game == game_id,
                    Or(
                        And(
                            Message.author == request.ctx.user.id,
                            Message.recipient == player_id,
                        ),
                        And(
                            Message.author == player_id,
                            Message.recipient == request.ctx.user.id,
                        ),
                    ),
                )
            ),
            Message.created_at < (date if date else datetime.now(UTC)),
        )
        .sort(-Message.created_at)
        .limit(MSG_PAGE_SIZE)
    )

    return json([msg.dict() for msg in msgs])


@bp.route("/v1/messages/<game_id>/<player_id>", methods=["POST"])
@authorized()
@openapi.operation("Send a message to a player")
@openapi.description("Send a message to a player")
async def create_message(request: Request, game_id: str, player_id: str):
    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    if (
        not data.get("content")
        or not isinstance(data["content"], str)
        or not data["content"].strip()
        or len(data["content"]) > 2000
    ):
        raise exceptions.BadRequest("Bad Request")

    members = (
        [request.ctx.user.id]
        if player_id == "global"
        else [request.ctx.user.id, player_id]
    )

    game = await Game.find_one(Game.id == game_id, In(Game.players, members))
    if not game:
        raise exceptions.NotFound("Player or Game not found")

    message = Message(
        author=request.ctx.user.id,
        recipient=player_id,
        game=game_id,
        content=data["content"],
    )
    await message.save()

    gateway.send_to_users(
        game.members if player_id == "global" else members,
        gateway.GatewayOpCode.MESSAGE_CREATE,
        message.dict(),
    )

    return json(message.dict())
