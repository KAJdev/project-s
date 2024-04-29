from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Message, Player, Game, User
from modules.auth import authorized
from modules import gateway
from beanie.operators import Or, And, In

MSG_PAGE_SIZE = 100

bp = Blueprint("messages")


@bp.route("/v1/games/<game_id>/messages/<recipient>", methods=["GET"])
@authorized()
@openapi.operation("Get messages in a channel")
@openapi.description("Get messages in a channel")
async def get_messages(request: Request, game_id: str, recipient: str):
    player = await Player.find_one(
        Player.user == request.ctx.user.id, Player.game == game_id
    )
    if not player:
        raise exceptions.NotFound("Player not found")

    members = [player.id] if recipient == "global" else [player.id, recipient]

    game = await Game.find_one(
        Game.id == game_id, In(Game.members.id, members), fetch_links=True
    )
    if not game:
        raise exceptions.NotFound("Player or Game not found")

    before = request.args.get("before", None)
    date = datetime.fromisoformat(before.strip("Z")) if before else None

    msgs = (
        await Message.find(
            (
                And(
                    Message.game == game_id,
                    Message.recipient == None,
                )
                if recipient == "global"
                else And(
                    Message.game == game_id,
                    Or(
                        And(
                            Message.author == player.id,
                            Message.recipient == recipient,
                        ),
                        And(
                            Message.author == recipient,
                            Message.recipient == player.id,
                        ),
                    ),
                )
            ),
            Message.created_at < (date if date else datetime.now(UTC)),
        )
        .sort(-Message.created_at)
        .limit(MSG_PAGE_SIZE)
        .to_list(None)
    )

    return json([msg.dict() for msg in msgs])


@bp.route("/v1/games/<game_id>/messages/<recipient>", methods=["POST"])
@authorized()
@openapi.operation("Send a message to a player")
@openapi.description("Send a message to a player")
async def create_message(request: Request, game_id: str, recipient: str):
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

    player = await Player.find_one(
        Player.user == request.ctx.user.id, Player.game == game_id
    )
    if not player:
        raise exceptions.NotFound("Player not found")

    members = [player.id] if recipient == "global" else [player.id, recipient]

    game = await Game.find_one(
        Game.id == game_id, In(Game.members.id, members), fetch_links=True
    )
    if not game:
        raise exceptions.NotFound("Player or Game not found")

    recipient_player = next((p for p in game.members if p.id == recipient), None)
    if recipient != "global" and not recipient_player:
        raise exceptions.NotFound("Recipient not found")

    message = Message(
        author=player.id,
        recipient=recipient if recipient != "global" else None,
        game=game_id,
        content=data["content"],
    )
    await message.save()

    gateway.send_to_users(
        (
            [m.user for m in game.members]
            if recipient == "global"
            else [
                player.user,
                recipient_player.user,
            ]
        ),
        gateway.GatewayOpCode.MESSAGE_CREATE,
        message.dict(),
    )

    return json(message.dict())
