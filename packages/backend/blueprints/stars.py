import asyncio
from modules.db import Game, Player, Star
import asyncio
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.auth import authorized
from beanie.operators import Or, And, In

bp = Blueprint("stars")


@bp.route("/v1/games/<game_id>/stars/<star_id>/upgrade", methods=["PATCH"])
@authorized()
@openapi.operation("Upgrade a star")
@openapi.description("Upgrade a star")
async def upgrade_star(request: Request, game_id: str, star_id: str):
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

    star = await Star.find_one(And(Star.game == game.id, Star.id == star_id))
    if not star:
        raise exceptions.NotFound("Star not found")

    costs = star.get_all_costs(player.research_levels.terraforming)
    print(costs)
    if costs[aspect] > player.cash:
        raise exceptions.BadRequest("Not enough resources")

    player.cash -= costs[aspect]
    setattr(star, aspect, getattr(star, aspect) + 1)

    await asyncio.gather(player.save_changes(), star.save_changes())

    return json(star.dict())


async def star_tick(game: Game, stars: list[Star], hourly=False):
    tasks = []
    for star in stars:
        star.do_production(game)
        tasks.append(star.save_changes())

    await asyncio.gather(*tasks)
