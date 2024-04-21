import asyncio
import aiocron

from blueprints.scan import on_scan
from modules.db import Game, Star
from modules.utils import print
from blueprints.stars import star_tick
from blueprints.carriers import carrier_tick
from blueprints.players import player_tick


async def game_tick(game: Game, hourly=False):
    stars = await Star.find(Star.game == game.id).to_list(None)
    await star_tick(game, stars, hourly=hourly)
    await carrier_tick(game, stars, hourly=hourly)
    await player_tick(game, stars, hourly=hourly)
    on_scan(game)


@aiocron.crontab("1-59 * * * *", start=False)
async def games_tick():
    print("Game tick", important=True)
    games = await Game.find(
        Game.started_at != None, Game.winner == None, fetch_links=True
    ).to_list(None)

    for game in games:
        asyncio.create_task(game_tick(game))


@aiocron.crontab("0 * * * *", start=False)
async def hourly_tick():
    print("Hourly tick", important=True)
    games = await Game.find(
        Game.started_at != None, Game.winner == None, fetch_links=True
    ).to_list(None)

    for game in games:
        asyncio.create_task(game_tick(game, hourly=True))
