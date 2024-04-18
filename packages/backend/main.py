import asyncio
import datetime
from os import getenv
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from pymongo.collection import Collection
from dotenv import load_dotenv
from sanic_ext import openapi
import bcrypt

from models import Channel, GatewayOpCode, Message, User
import utils

load_dotenv()

from sanic import Request, Sanic, json, text
import gateway

ENVIRONMENT = getenv("MONGO_DB", "staging")
DEBUG = getenv("DEBUG", None) is not None
MSG_PAGE_SIZE = 100

app = Sanic("app")
app.config["REQUEST_MAX_SIZE"] = (1024**3) * 5  # 5GB
app.config.CORS_ORIGINS = "*"
app.config.FALLBACK_ERROR_FORMAT = "json"

cluster = AsyncIOMotorClient(getenv("MONGO_URL"))
db = cluster[ENVIRONMENT]
users: Collection = db["users"]
messages: Collection = db["messages"]
attachments: Collection = db["attachments"]
channels: Collection = db["channels"]

app.ext.openapi.add_security_scheme("api_key", "apiKey")


async def authenticate(request: Request, overrideToken: str = None) -> User | None:
    tok = overrideToken or request.headers.get("Authorization")

    if not tok:
        return None

    user = await users.find_one({"token": tok})
    if not user:
        return None

    return User(**user)


def internal_auth(request: Request) -> bool:
    if not (internal_token := request.headers.get("Authorization")):
        return False

    return internal_token == getenv("INTERNAL_TOKEN")


async def get_seen_user_ids(user_id: str) -> list[str]:
    """returns a list of all user ids that can see that user (any user ids in any channel with that user)"""
    users = set()
    async for channel in channels.find({"members": user_id}):
        users.update(channel["members"])

    return list(users)


async def get_channel_members(channel_id: str) -> list[str]:
    """returns a list of all user ids that are in that channel"""
    return (await channels.find_one({"id": channel_id}))["members"]


@app.route("/v1/users/<user_id>", methods=["GET"])
@openapi.operation("Get a user")
@openapi.description("Get a user")
@openapi.response(200, {"application/json": User})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def get_user(request: Request, user_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    found_user = None
    if user_id == "@me":
        found_user = user
    else:
        found_user = await users.find_one({"id": user_id})

        if not found_user:
            return text("Not Found", status=404)
        else:
            found_user = User(**found_user)

    return json(found_user.to_dict(external=True))


@app.route("/v1/users/<user_id>", methods=["PATCH"])
@openapi.operation("Update a user")
@openapi.description("Update a user. Currently only supports `@me`")
@openapi.response(200, {"application/json": User})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def update_user(request: Request, user_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    if user_id != "@me":
        return text("Unauthorized", status=401)

    data = request.json
    if not data:
        return text("Bad Request", status=400)

    validated = User.validate_update(data)

    #  make sure username is unique
    if "username" in validated:
        if await users.count_documents(
            {"username": validated["username"], "id": {"$ne": user.id}}
        ):
            return text("Bad Request", status=400)

    user = await users.find_one_and_update(
        {"id": user.id}, {"$set": validated}, return_document=ReturnDocument.AFTER
    )
    user = User(**user)
    gateway.send_to_users(
        await get_seen_user_ids(user.id),
        GatewayOpCode.USER_UPDATE,
        user.to_dict(external=True),
    )
    return json(user.to_dict(external=True))


@app.route("/v1/signup", methods=["POST"])
@openapi.exclude()
async def signup(request: Request):
    data = request.json
    if not data:
        return text("Bad Request", status=400)

    if not all(data.get(k) for k in ("username", "password", "email")):
        return text("Bad Request", status=400)

    # make sure username and email is unique
    if await users.count_documents({"username": data["username"]}):
        return text("Username must be unique", status=400)

    if await users.count_documents({"email": data["email"]}):
        return text("Email must be unique", status=400)

    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    user_id = utils.generate_id()
    user = User(
        id=user_id,
        username=data["username"],
        display_name=data.get("display_name", data["username"]),
        password=hashed.decode("utf-8"),
        email=data["email"],
        token=utils.generate_token(user_id),
    )

    await users.insert_one(user.to_dict(external=False))
    return json(user.to_dict(external=True, include_token=True))


@app.route("/v1/login", methods=["POST"])
@openapi.exclude()
async def signin(request: Request):
    data = request.json
    if not data:
        return text("Bad Request", status=400)

    if not all(data.get(k) for k in ("username", "password")):
        return text("Bad Request", status=400)

    user = await users.find_one(
        {"$or": [{"username": data["username"]}, {"email": data["username"]}]}
    )

    if not user:
        # Prevent timing attacks
        bcrypt.checkpw(b"password", b"password")
        return text("Unauthorized", status=401)

    if not bcrypt.checkpw(
        data["password"].encode("utf-8"), user["password"].encode("utf-8")
    ):
        return text("Unauthorized", status=401)

    user = User(**user)
    return json(user.to_dict(external=True, include_token=True))


@app.route("/v1/channels", methods=["GET"])
@openapi.operation("Get your channels")
@openapi.description("Get all the channels you're in")
@openapi.response(200, {"application/json": list[Channel]})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def get_channels(request: Request):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    return json(
        [
            Channel(**c).to_dict(external=True)
            async for c in channels.find(
                {"$or": [{"owner": user.id}, {"members": user.id}, {"public": True}]}
            ).sort("name")
        ]
    )


@app.route("/v1/channels", methods=["POST"])
@openapi.operation("Create a channel")
@openapi.description("Create a channel")
@openapi.response(200, {"application/json": Channel})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def create_channel(request: Request):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    data = request.json
    if not data:
        return text("Bad Request", status=400)

    print(data)

    validated = Channel.validate_update(data)
    channel = Channel(
        **validated,
        id=utils.generate_id(),
        owner=user.id,
        members=[user.id],
    )
    await channels.insert_one(channel.to_dict(external=False))

    if channel.public:
        gateway.send_to_all(
            GatewayOpCode.CHANNEL_CREATE, channel.to_dict(external=True)
        )
    else:
        gateway.send_to_users(
            [user.id], GatewayOpCode.CHANNEL_CREATE, channel.to_dict(external=True)
        )

    return json(channel.to_dict(external=True))


@app.route("/v1/channels/<channel_id>", methods=["GET"])
@openapi.operation("Get a channel")
@openapi.description("Get a channel")
@openapi.response(200, {"application/json": Channel})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def get_channel(request: Request, channel_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    channel = await channels.find_one(
        {
            "id": channel_id,
            "$or": [{"owner": user.id}, {"members": user.id}, {"public": True}],
        }
    )
    if not channel:
        return text("Unauthorized", status=401)

    return json(Channel(**channel).to_dict(external=True))


@app.route("/v1/channels/<channel_id>", methods=["PATCH"])
@openapi.operation("Update a channel")
@openapi.description("Update a channel")
@openapi.response(200, {"application/json": Channel})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def update_channel(request: Request, channel_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    data = request.json
    if not data:
        return text("Bad Request", status=400)

    channel = await channels.find_one({"id": channel_id, "owner": user.id})
    if not channel:
        return text("Unauthorized", status=401)

    past_channel = Channel(**channel)

    validated = Channel.validate_update(data)
    channel = await channels.find_one_and_update(
        {"id": channel_id, "owner": user.id},
        {"$set": validated},
        return_document=ReturnDocument.AFTER,
    )
    channel = Channel(**channel)

    if past_channel.public != channel.public:
        if channel.public:
            gateway.send_to_all(
                GatewayOpCode.CHANNEL_CREATE, channel.to_dict(external=True)
            )
        else:
            # channel is now private, should disappear from all users except owner and members
            await gateway.send_to_users(
                await get_seen_user_ids(user.id),
                GatewayOpCode.CHANNEL_DELETE,
                {"id": channel_id},
            )

            gateway.send_to_users(
                channel.members,
                GatewayOpCode.CHANNEL_UPDATE,
                channel.to_dict(external=True),
            )
    else:
        if channel.public:
            gateway.send_to_all(
                GatewayOpCode.CHANNEL_UPDATE, channel.to_dict(external=True)
            )
        else:
            gateway.send_to_users(
                channel.members,
                GatewayOpCode.CHANNEL_UPDATE,
                channel.to_dict(external=True),
            )

    return json(channel.to_dict(external=True))


@app.route("/v1/channels/<channel_id>", methods=["DELETE"])
@openapi.operation("Delete a channel")
@openapi.description("Delete a channel")
@openapi.response(200, {"application/json": {"status": "ok"}})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def delete_channel(request: Request, channel_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    channel = await channels.find_one({"id": channel_id, "owner": user.id})
    if not channel:
        return text("Unauthorized", status=401)

    await channels.delete_one({"id": channel_id})

    if channel.get("public", False):
        gateway.send_to_all(GatewayOpCode.CHANNEL_DELETE, {"id": channel_id})
    else:
        gateway.send_to_users(
            channel["members"],
            GatewayOpCode.CHANNEL_DELETE,
            {"id": channel_id},
        )

    return json({"status": "ok"})


@app.route("/v1/channels/<channel_id>/messages", methods=["GET"])
@openapi.operation("Get messages in a channel")
@openapi.description("Get messages in a channel")
@openapi.response(200, {"application/json": list[Message]})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def get_messages(request: Request, channel_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    channel = await channels.find_one(
        {
            "id": channel_id,
            "$or": [{"owner": user.id}, {"members": user.id}, {"public": True}],
        }
    )
    if not channel:
        return text("Unauthorized", status=401)

    before = request.args.get("before", None)
    date = datetime.datetime.fromisoformat(before.strip("Z")) if before else None

    msgs = [
        Message(**m).to_dict(external=True)
        async for m in messages.find(
            {
                "channel": channel_id,
                **({"created_at": {"$lt": date}} if date else {}),
            }
        )
        .sort("created_at", -1)
        .limit(MSG_PAGE_SIZE)
    ]

    return json(msgs)


@app.route("/v1/channels/<channel_id>/messages", methods=["POST"])
@openapi.operation("Create a message")
@openapi.description("Create a message")
@openapi.response(200, {"application/json": Message})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def create_message(request: Request, channel_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    data = request.json
    if not data:
        return text("Bad Request", status=400)

    channel = await channels.find_one(
        {
            "id": channel_id,
            "$or": [{"owner": user.id}, {"members": user.id}, {"public": True}],
        }
    )
    if not channel:
        return text("Unauthorized", status=401)

    validated = Message.validate_update(data)
    message = Message(
        **validated,
        id=utils.generate_id(),
        owner=user.id,
        channel=channel_id,
    )
    await messages.insert_one(message.to_dict(external=False))

    if channel.get("public", False):
        gateway.send_to_all(
            GatewayOpCode.MESSAGE_CREATE, message.to_dict(external=True)
        )
    else:
        gateway.send_to_users(
            channel["members"],
            GatewayOpCode.MESSAGE_CREATE,
            message.to_dict(external=True),
        )

    return json(message.to_dict(external=True))


@app.route("/v1/channels/<channel_id>/message/<message_id>", methods=["PATCH"])
@openapi.operation("Update a message")
@openapi.description("Update a message")
@openapi.response(200, {"application/json": Message})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def update_message(request: Request, channel_id: str, message_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    data = request.json
    if not data:
        return text("Bad Request", status=400)

    channel = await channels.find_one({"id": channel_id})
    if not channel:
        return text("Unauthorized", status=401)

    message = await messages.find_one(
        {"id": message_id, "owner": user.id, "channel": channel_id}
    )
    if not message:
        return text("Unauthorized", status=401)

    validated = Message.validate_update(data)
    message = await messages.find_one_and_update(
        {"id": message_id, "owner": user.id},
        {"$set": validated},
        return_document=ReturnDocument.AFTER,
    )
    message = Message(**message)

    if channel.get("public", False):
        gateway.send_to_all(
            GatewayOpCode.MESSAGE_UPDATE, message.to_dict(external=True)
        )
    else:
        gateway.send_to_users(
            channel["members"],
            GatewayOpCode.MESSAGE_UPDATE,
            message.to_dict(external=True),
        )

    return json(message.to_dict(external=True))


@app.route("/v1/channels/<channel_id>/message/<message_id>", methods=["DELETE"])
@openapi.operation("Delete a message")
@openapi.description("Delete a message")
@openapi.response(200, {"application/json": {"status": "ok"}})
@openapi.response(401, {"text/plain": "Unauthorized"})
async def delete_message(request: Request, channel_id: str, message_id: str):
    if not (user := await authenticate(request)):
        return text("Unauthorized", status=401)

    channel = await channels.find_one({"id": channel_id})
    if not channel:
        return text("Unauthorized", status=401)

    message = await messages.find_one(
        {"id": message_id, "owner": user.id, "channel": channel_id}
    )
    if not message:
        return text("Unauthorized", status=401)

    await messages.delete_one({"id": message_id})

    if channel.get("public", False):
        gateway.send_to_all(GatewayOpCode.MESSAGE_DELETE, {"id": message_id})
    else:
        gateway.send_to_users(
            channel["members"],
            GatewayOpCode.MESSAGE_DELETE,
            {"id": message_id},
        )

    return json({"status": "ok"})


@app.websocket("/v1/gateway")
@openapi.exclude()
async def feed(request: Request, ws: gateway.Websocket):
    if not (user := await authenticate(request, request.args.get("token"))):
        await ws.send("Unauthorized")
        return

    gateway.add_websocket_connection(user.id, ws)

    try:

        while True:
            op, data = utils.from_wh(await ws.recv())
            if op == GatewayOpCode.PING:
                await ws.send(utils.wh_msg(GatewayOpCode.PONG))
                continue

            if op == GatewayOpCode.REQUEST_CHANNELS:
                for channel in await channels.find(
                    {
                        "$or": [
                            {"owner": user.id},
                            {"members": user.id},
                            {"public": True},
                        ]
                    }
                ).to_list(None):
                    await ws.send(
                        utils.wh_msg(
                            GatewayOpCode.CHANNEL_CREATE,
                            Channel(**channel).to_dict(external=True),
                        )
                    )

                gateway.send_to_user(user.id, GatewayOpCode.READY)

    finally:
        gateway.remove_websocket_connection(user.id)


app.ext.openapi.secured("api_key")
app.ext.openapi.describe(
    "Project S API",
    "1.0.0",
    description="The official API for Project S",
)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(getenv("PORT", 8000)), debug=DEBUG)
