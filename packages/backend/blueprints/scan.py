from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Carrier, GameSettings, Message, Player, Game, Star, User
from modules.auth import authorized
from modules.worldgen import distance
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
async def get_scan(request: Request, game_id: str):
    game = await Game.find_one(
        Game.id == game_id, Game.members.user == request.ctx.user.id, fetch_links=True
    )

    if not game:
        raise exceptions.NotFound("Game not found")

    players = await Player.find(Player.game == game_id).to_list(None)
    stars = await Star.find(Star.game == game_id).to_list(None)
    carriers = await Carrier.find(Carrier.game == game_id).to_list(None)

    current_player = next(p for p in players if p.user == request.ctx.user.id)
    player_stars = [s for s in stars if s.occupier == current_player.id]
    scan_distance = current_player.get_scan_distance()

    scan: ScanResponse = {
        "players": [p.dict() for p in players],
        "stars": [],
        "carriers": [],
    }

    # filter things
    scan["carriers"] = [
        c.dict()
        for c in carriers
        if (
            any(
                distance((c.position.x, c.position.y), (s.position.x, s.position.y))
                <= scan_distance
                for s in player_stars
            )
            or c.owner == current_player.id
        )
    ]

    for star in stars:
        if (
            any(
                distance(
                    (star.position.x, star.position.y), (s.position.x, s.position.y)
                )
                <= scan_distance
                for s in player_stars
            )
            or star.occupier == current_player.id
        ):
            scan["stars"].append(star.dict())
        else:
            scan["stars"].append(star.dict_unscanned())

    return json(scan)
