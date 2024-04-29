from datetime import datetime, UTC, timedelta
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Census, Message, Player, Game, User
from modules.auth import authorized
from modules import gateway
from beanie.operators import Or, And, In

bp = Blueprint("intel")


@bp.route("/v1/games/<game_id>/census", methods=["GET"])
@authorized()
@openapi.operation("Get the census of a game")
@openapi.description("Get the census of a game")
async def get_census(request: Request, game_id: str):
    game = await Game.find_one(
        Game.id == game_id, Game.members.user == request.ctx.user.id, fetch_links=True
    )
    if not game:
        raise exceptions.NotFound("Player or Game not found")

    census_points = (
        await Census.find(
            Census.game == game_id,
            Census.created_at > datetime.now(UTC) - timedelta(hours=24),
        )
        .sort(-Census.created_at)
        .to_list(None)
    )

    return json([cp.dict() for cp in census_points])
