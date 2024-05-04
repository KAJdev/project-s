import asyncio
from modules.db import Carrier, Game, Planet, Player, Star
import asyncio
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.auth import authorized
from beanie.operators import Or, And, In

bp = Blueprint("planets")


@bp.route("/v1/games/<game_id>/planets/<planet_id>/upgrade", methods=["PATCH"])
@authorized()
@openapi.operation("Upgrade a planet")
@openapi.description("Upgrade a planet")
async def upgrade_star(request: Request, game_id: str, planet_id: str):
    player = await Player.find_one(
        Player.game == game_id, Player.user == request.ctx.user.id
    )

    if not player:
        raise exceptions.BadRequest("Bad Request")

    game = await Game.get(game_id, fetch_links=True)
    if not game:
        raise exceptions.NotFound("Game not found")

    if not game.started_at:
        raise exceptions.BadRequest("Game not yet started")

    data = request.json
    if not data:
        raise exceptions.BadRequest("Bad Request")

    aspect = data.get("aspect")
    if aspect not in ["economy", "industry", "science"]:
        raise exceptions.BadRequest("Bad Request")

    planet = await Planet.find_one(And(Planet.game == game.id, Planet.id == planet_id))
    if not planet:
        raise exceptions.NotFound("Star not found")

    costs = planet.get_all_costs(player.research_levels.terraforming)
    print(costs)
    if costs[aspect] > player.cash:
        raise exceptions.BadRequest("Not enough resources")

    player.cash -= costs[aspect]
    setattr(planet, aspect, getattr(planet, aspect) + 1)

    await asyncio.gather(
        player.inc({Player.cash: -costs[aspect]}), planet.inc({aspect: 1})
    )

    return json(planet.dict())


async def planet_tick(
    game: Game, stars: list[Star], carriers: list[Carrier], hourly=False
):
    tasks = []
    for star in stars:
        for planet in star.planets:
            planet.do_production(game)
            await planet.do_orbit(game, stars, carriers)
            tasks.append(planet.save_changes())

    await asyncio.gather(*tasks)
