from sanic import Websocket
from modules import utils
import asyncio
from enum import Enum


class GatewayOpCode(Enum):
    INVALID = 0
    READY = 1
    PING = 2
    PONG = 3
    MESSAGE_CREATE = 4
    MESSAGE_UPDATE = 5
    MESSAGE_DELETE = 6
    CHANNEL_CREATE = 7
    CHANNEL_UPDATE = 8
    CHANNEL_DELETE = 9
    USER_JOIN = 10
    USER_LEAVE = 11
    USER_UPDATE = 12
    REQUEST_CHANNELS = 13


GATEWAY_CONNECTIONS: dict[str, Websocket] = {}


def add_websocket_connection(user_id: str, websocket: Websocket):
    global GATEWAY_CONNECTIONS
    GATEWAY_CONNECTIONS[user_id] = websocket


def remove_websocket_connection(user_id: str):
    global GATEWAY_CONNECTIONS
    if user_id in GATEWAY_CONNECTIONS:
        ws = GATEWAY_CONNECTIONS[user_id]
        del GATEWAY_CONNECTIONS[user_id]
        ws.close()


def send_to_user(user_id: str, op: GatewayOpCode, data: dict | None = None):
    global GATEWAY_CONNECTIONS
    if user_id in GATEWAY_CONNECTIONS:
        ws = GATEWAY_CONNECTIONS[user_id]
        return asyncio.create_task(ws.send(utils.wh_msg(op, data)))


def send_to_users(user_ids: list[str], op: GatewayOpCode, data: dict | None = None):
    tasks = []
    for user_id in user_ids:
        task = send_to_user(user_id, op, data)
        if task:
            tasks.append(task)

    if tasks:
        return asyncio.gather(*tasks)


def send_to_all(op: GatewayOpCode, data: dict | None = None):
    global GATEWAY_CONNECTIONS
    tasks = []
    for user_id, ws in GATEWAY_CONNECTIONS.items():
        task = asyncio.create_task(ws.send(utils.wh_msg(op, data)))
        tasks.append(task)

    if tasks:
        return asyncio.gather(*tasks)
