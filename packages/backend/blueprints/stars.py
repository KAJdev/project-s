from modules.db import Game, Star


async def star_tick(game: Game, stars: list[Star], hourly=False):
    for star in stars:
        star.do_production(game)
        await star.save()
