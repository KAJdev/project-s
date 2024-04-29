from sanic import Blueprint, Request, json
from sanic_ext import openapi
from modules.db import (
    News,
)
from modules.auth import authorized

bp = Blueprint("news")


@bp.route("/v1/games/<game_id>/news", methods=["GET"])
@openapi.operation("Get news")
@openapi.description("Get news")
async def get_news(request: Request, game_id: str):
    news = await News.find(News.game == game_id).sort(-News.created_at).to_list(100)
    return json([n.dict() for n in news])
