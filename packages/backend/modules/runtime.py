import asyncio
import aiocron

from blueprints.scan import on_scan
from modules.db import Game
from modules.utils import print


@aiocron.crontab("* * * * *", start=False)
async def games_tick():
    print("Game tick", important=True)
    games = await Game.find(
        Game.started_at != None, Game.winner == None, fetch_links=True
    ).to_list(None)

    for game in games:
        on_scan(game)
