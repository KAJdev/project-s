import asyncio
import time
from beanie import WriteRules
from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import (
    CombatEvent,
    Destination,
    Event,
    GameSettings,
    Message,
    Player,
    Game,
    ProductionEvent,
    Star,
    User,
    Carrier,
    distance,
    Technology,
)
from modules.auth import authorized
from modules import gateway
from modules.worldgen import (
    generate_carrier_name,
)
from beanie.operators import Or, And, In

bp = Blueprint("players")


@bp.route("/v1/games/<game_id>/players/<player_id>", methods=["PATCH"])
@authorized()
@openapi.operation("Edit your player")
@openapi.description("Edit your player")
async def edit_player(request: Request, game_id: str, player_id: str):
    if player_id != "@me":
        raise exceptions.Forbidden("You can only edit your own player")

    data = request.json
    player = await Player.find_one(
        Player.user == request.ctx.user.id, Player.game == game_id
    )
    if not player:
        raise exceptions.NotFound("Player not found")

    research_queue = data.get("research_queue")

    if not research_queue:
        raise exceptions.BadRequest("Missing research_queue")

    if not isinstance(research_queue, list):
        raise exceptions.BadRequest("research_queue must be a list")

    if len(research_queue) > 5:
        raise exceptions.BadRequest("research_queue must have at most 5 items")

    for tech_id in research_queue:
        if tech_id not in Technology.all():
            raise exceptions.BadRequest("Invalid tech id")

    player.research_queue = research_queue
    await player.save_changes()

    return json(player.dict())


async def player_tick(game: Game, stars: list[Star], hourly=False):
    is_production_tick = hourly and time.gmtime().tm_hour == 2

    for player in game.members:
        if hourly:
            player.do_research(game, stars)
        player.do_economy(stars)

        # check if its midnight UTC
        if is_production_tick:
            player.do_production(stars)

        await player.save_changes()

    if is_production_tick:
        total_cash_created = sum([s.economy for s in stars]) * 10

        await Event(
            game=game.id,
            type="production",
            data=ProductionEvent(
                total_cash_created=total_cash_created,
            ),
        ).save()
