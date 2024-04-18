from datetime import datetime
import json
import os
import base64
from uuid import uuid4

from models import GatewayOpCode


def generate_id() -> str:
    return str(uuid4())


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
