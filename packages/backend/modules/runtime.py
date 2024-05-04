import asyncio
import random
import time
import aiocron

from blueprints.scan import on_scan
from modules.db import Carrier, Census, Game, PlayerCensus, Star
from modules import newsgen
from modules.utils import print
from blueprints.planets import planet_tick
from blueprints.carriers import carrier_tick
from blueprints.players import player_tick


async def game_tick(game: Game, hourly=False):
    print(f"Game tick ({game.name}) {game.id}")
    stars = await Star.find(Star.game == game.id, fetch_links=True).to_list(None)
    carriers = await Carrier.find(Carrier.game == game.id).to_list(None)
    planets = [p for s in stars for p in s.planets]
    await planet_tick(game, stars, carriers, hourly=hourly)
    await carrier_tick(game, stars, carriers, hourly=hourly)
    await player_tick(game, stars, hourly=hourly)

    if (
        random.random() < 0.01
    ):  # 1% chance, should be on average 1 article every 100 minutes
        await newsgen.create_misc_article(game, planets)

    # every 10 minutes
    if time.gmtime().tm_min % 10 == 0:
        carriers = await Carrier.find(Carrier.game == game.id).to_list(None)
        census = Census(
            game=game.id,
            players=[
                PlayerCensus(
                    player=player.id,
                    planets=len([p for p in planets if p.occupier == player.id]),
                    carriers=len([c for c in carriers if c.owner == player.id]),
                    cash=int(player.cash),
                    ships=sum([p.ships for p in planets if p.occupier == player.id])
                    + sum([c.ships for c in carriers if c.owner == player.id]),
                    industry=sum(
                        [p.industry for p in planets if p.occupier == player.id]
                    ),
                    economy=sum(
                        [p.economy for p in planets if p.occupier == player.id]
                    ),
                    science=sum(
                        [p.science for p in planets if p.occupier == player.id]
                    ),
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
