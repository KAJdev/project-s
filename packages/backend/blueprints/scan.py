import asyncio
from datetime import datetime, UTC
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import (
    Carrier,
    GameSettings,
    Message,
    Planet,
    Player,
    Game,
    Star,
    distance,
)
from modules.auth import authorized
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
    planets: list[Planet]
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
    stars = await Star.find(Star.game == game_id, fetch_links=True).to_list(None)
    planets = [p for s in stars for p in s.planets]
    carriers = await Carrier.find(Carrier.game == game_id).to_list(None)

    current_player = next(
        p for p in players if ((p.user == user_id) if user_id else (p.id == player_id))
    )
    player_planets = [p for p in planets if p.occupier == current_player.id]
    scan_distance = current_player.get_scan_distance()

    scan: ScanResponse = {
        "game": game.id,
        "players": [
            (p.dict() if p.id == current_player.id else p.dict_not_self())
            for p in players
        ],
        "stars": [star.dict() for star in stars],
        "planets": [],
        "carriers": [],
    }

    # filter things
    scan["carriers"] = [
        (c.dict() if c.owner == current_player.id else c.dict_not_self())
        for c in carriers
        if (
            any(
                distance((c.position.x, c.position.y), (p.position.x, p.position.y))
                <= scan_distance
                for p in player_planets
            )
            or c.owner == current_player.id
        )
    ]

    for planet in planets:
        if (
            any(
                distance(
                    (planet.position.x, planet.position.y),
                    (p.position.x, p.position.y),
                )
                <= scan_distance
                for p in player_planets
            )
            or planet.occupier == current_player.id
        ):
            scan["planets"].append(planet.dict())
        else:
            scan["planets"].append(planet.dict_unscanned())

    return scan


@bp.route("/v1/games/<game_id>/scan", methods=["GET"])
@authorized()
@openapi.operation("Poll a game for changes in state")
@openapi.description("Poll a game for changes in state")
async def get_scan(request: Request, game_id: str):
    return json(await scan_game(game_id=game_id, user_id=request.ctx.user.id))


async def send_scan(game: Game, player: Player):
    scan = await scan_game(game=game, player_id=player.id)
    gateway.send_to_user(
        player.user,
        gateway.GatewayOpCode.GALAXY_SCAN,
        scan,
    )


def on_scan(game: Game):
    for player in game.members:
        asyncio.create_task(send_scan(game, player))
