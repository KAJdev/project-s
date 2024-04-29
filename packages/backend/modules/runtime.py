import asyncio
import random
import time
import aiocron

from blueprints.scan import on_scan
from modules.db import Carrier, Census, Game, PlayerCensus, Star
from modules import newsgen
from modules.utils import print
from blueprints.stars import star_tick
from blueprints.carriers import carrier_tick
from blueprints.players import player_tick


async def game_tick(game: Game, hourly=False):
    print(f"Game tick ({game.name}) {game.id}")
    stars = await Star.find(Star.game == game.id).to_list(None)
    await star_tick(game, stars, hourly=hourly)
    await carrier_tick(game, stars, hourly=hourly)
    await player_tick(game, stars, hourly=hourly)

    if random.random() < 0.05:
        await newsgen.create_misc_article(game, stars)

    # every 10 minutes
    if time.gmtime().tm_min % 10 == 0:
        carriers = await Carrier.find(Carrier.game == game.id).to_list(None)
        census = Census(
            game=game.id,
            players=[
                PlayerCensus(
                    player=player.id,
                    stars=len([s for s in stars if s.occupier == player.id]),
                    carriers=len([c for c in carriers if c.owner == player.id]),
                    cash=int(player.cash),
                    ships=sum([s.ships for s in stars if s.occupier == player.id])
                    + sum([c.ships for c in carriers if c.owner == player.id]),
                    industry=sum(
                        [s.industry for s in stars if s.occupier == player.id]
                    ),
                    economy=sum([s.economy for s in stars if s.occupier == player.id]),
                    science=sum([s.science for s in stars if s.occupier == player.id]),
                    research_levels=player.research_levels,
                )
                for player in game.members
            ],
        )

        await census.save()

        print(f"Saved census for game ({game.name}) {game.id}")

    on_scan(game)
    print(f"finished tick for game ({game.name}) {game.id}", important=True)


@aiocron.crontab("1-59 * * * *", start=False)
async def games_tick():
    print("Minutely tick", important=True)
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
