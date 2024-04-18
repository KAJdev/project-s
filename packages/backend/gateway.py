from sanic import Websocket
import utils
from models import GatewayOpCode
import asyncio


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
