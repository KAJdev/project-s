og_print = print
import inspect
from os import getenv
from uuid import uuid4
from sanic import Request
import base64
from datetime import datetime
import os
import json
from modules.gateway import GatewayOpCode


def generate_id():
    return str(uuid4())


def print(*args, important=False, **kwargs):
    stack = inspect.stack()
    caller_frame = stack[1]
    frame_info = inspect.getframeinfo(caller_frame[0])
    mod = frame_info.filename.split(".")[0].split("/")[-1].split("\\")[-1]
    og_print(
        f"--->" if important else "    ",
        f"[{mod}]",
        *args,
        **kwargs,
    )


def internal_auth(request: Request) -> bool:
    if not (internal_token := request.headers.get("Authorization")):
        return False

    return internal_token == getenv("INTERNAL_TOKEN")


def generate_token(id_: str) -> str:
    b64id = base64.b64encode(id_.encode()).decode()
    timestampb64 = (
        base64.b64encode(str(int(datetime.utcnow().timestamp())).encode())
        .decode()
        .rstrip("=")
    )
    randomness = base64.b64encode(os.urandom(18)).decode()

    return f"{b64id}.{timestampb64}.{randomness}"


def deconstruct_token(token: str) -> tuple[str, int, str]:
    b64id, timestampb64, randomness = token.split(".")
    id_ = base64.b64decode(b64id).decode()
    timestamp = int(base64.b64decode(timestampb64 + "==").decode())

    return id_, timestamp, randomness


def wh_msg(type: GatewayOpCode, data: dict | None = None) -> str:
    return json.dumps(
        {
            "op": type.value,
            "d": data if data is not None else {},
        }
    )


def from_wh(msg: str) -> tuple[GatewayOpCode, dict]:
    try:
        msg = json.loads(msg)
    except json.JSONDecodeError:
        return GatewayOpCode.INVALID, {}

    try:
        op = GatewayOpCode(msg["op"])
    except KeyError:
        return GatewayOpCode.INVALID, {}

    return op, msg.get("d", {})