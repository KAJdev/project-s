import asyncio
from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import Carrier, GameSettings, Message, Player, Game, Star, User
from modules.auth import authorized
from modules.worldgen import distance
from modules import gateway
import aiocron
from typing import TypedDict
from modules.utils import print


MSG_PAGE_SIZE = 100

bp = Blueprint("scan")


class ScanResponse(TypedDict):
    game: str
    players: list[Player]
    stars: list[Star]
    carriers: list[Carrier]


async def scan_game(
    game_id: str = None, game: Game = None, user_id: str = None, player_id: str = None
) -> ScanResponse:
    if not user_id and not player_id:
        raise ValueError("Must provide either user_id or player_id")

    if not game and not game_id:
        raise ValueError("Must provide either game or game_id")

    if not game and game_id:
        game = await Game.find_one(
            Game.id == game_id,
            (
                (Game.members.user == user_id)
                if user_id
                else (Game.members.id == player_id)
            ),
            fetch_links=True,
        )

    if not game:
        raise exceptions.NotFound("Game not found")

    if not game_id:
        game_id = game.id

    players = await Player.find(Player.game == game_id).to_list(None)
    stars = await Star.find(Star.game == game_id).to_list(None)
    carriers = await Carrier.find(Carrier.game == game_id).to_list(None)

    current_player = next(
        p for p in players if ((p.user == user_id) if user_id else (p.id == player_id))
    )
    player_stars = [s for s in stars if s.occupier == current_player.id]
    scan_distance = current_player.get_scan_distance()

    scan: ScanResponse = {
        "game": game.id,
        "players": [
            (p.dict() if p.id == current_player.id else p.dict_not_self())
            for p in players
        ],
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

    return scan


@bp.route("/v1/games/<game_id>/scan", methods=["GET"])
@authorized()
@openapi.operation("Poll a game for changes in state")
@openapi.description("Poll a game for changes in state")
async def get_scan(request: Request, game_id: str):
    return json(await scan_game(game_id=game_id, user_id=request.ctx.user.id))


def on_scan(game: Game):
    print(f"Scanning game {game.id}")
    for player in game.members:

        async def send_scan():
            gateway.send_to_user(
                player.user,
                gateway.GatewayOpCode.GALAXY_SCAN,
                await scan_game(game=game, player_id=player.id),
            )

        asyncio.create_task(send_scan())
