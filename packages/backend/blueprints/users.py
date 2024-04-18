from sanic import Blueprint, Request, json, exceptions
from sanic_ext import openapi
from modules.db import User
from modules.auth import authorized

bp = Blueprint("users")


@bp.route("/v1/users/<user_id>", methods=["GET"])
@authorized()
@openapi.operation("Get a user")
@openapi.description("Get a user, supports `@me`")
async def get_user(request: Request, user_id: str):
    if user_id == "@me":
        return json(request.ctx.user.dict())
    raise exceptions.Unauthorized("Unauthorized")


@bp.route("/v1/users/<user_id>", methods=["PATCH"])
@authorized()
@openapi.operation("Update a user")
@openapi.description("Update a user. Currently only supports `@me`")
async def update_user(request: Request, user_id: str):
    if user_id != "@me":
        return exceptions.Unauthorized("Unauthorized")

    data = request.json
    if not data:
        return exceptions.BadRequest("Bad Request")

    # TODO: implement update logic
