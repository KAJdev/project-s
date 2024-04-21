from modules.db import Carrier, Game, Star


async def carrier_tick(game: Game, stars: list[Star], hourly=False):
    carriers = await Carrier.find(Carrier.game == game.id).to_list(None)

    for carrier in carriers:
        carrier.move(game, stars)
        await carrier.save()
