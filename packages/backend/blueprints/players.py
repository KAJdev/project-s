from modules.db import Game, Star


async def player_tick(game: Game, stars: list[Star], hourly=False):
    for player in game.members:
        if hourly:
            player.do_research(game, stars)
        player.do_economy(stars)
        await player.save_changes()
