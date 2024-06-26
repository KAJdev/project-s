import datetime
from os import getenv
from dotenv import load_dotenv
from sanic_ext import openapi
from sanic import Request, Sanic, json, text
import bcrypt
import pkgutil

from modules.db import Message, User, Player, Game
from modules.utils import from_wh, print, wh_msg
from modules.gateway import GatewayOpCode
from modules import gateway, db
from modules.auth import authenticate
from modules.runtime import games_tick, hourly_tick

load_dotenv()

ENVIRONMENT = getenv("ENV", "staging")
DEBUG = getenv("DEBUG", None) not in (None, "False", "0")
MSG_PAGE_SIZE = 100

app = Sanic("app")
app.config["REQUEST_MAX_SIZE"] = (1024**3) * 5  # 5GB
app.config.CORS_ORIGINS = "*"
app.config.FALLBACK_ERROR_FORMAT = "json"

app.ext.openapi.add_security_scheme("api_key", "apiKey")


@app.after_server_start
async def attach_db(app, loop):
    await db.init()
    games_tick.loop = loop
    games_tick.start()

    hourly_tick.loop = loop
    hourly_tick.start()


blueprint_names = [
    m.name for m in pkgutil.iter_modules(["blueprints"], prefix="blueprints.")
]
for extension in blueprint_names:
    if extension.split(".")[-1].startswith("_"):
        continue
    m = __import__(extension, fromlist=["blueprints"])
    if not hasattr(m, "bp"):
        print(f"Blueprint {extension} does not have a 'bp' attribute")
        continue
    app.blueprint(m.bp)
    print(f"Loaded blueprint: {extension}")


@app.websocket("/v1/gateway")
@openapi.exclude()
async def feed(request: Request, ws: gateway.Websocket):
    if not (token := request.args.get("token")):
        await ws.send("Unauthorized")
        return

    if not (user := await authenticate(request, token)):
        await ws.send("Unauthorized")
        return

    gateway.add_websocket_connection(user.id, ws)

    try:
        await ws.send(wh_msg(GatewayOpCode.READY))
        while True:
            op, data = from_wh(await ws.recv())
            if op == GatewayOpCode.PING:
                await ws.send(wh_msg(GatewayOpCode.PONG))
                continue

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
