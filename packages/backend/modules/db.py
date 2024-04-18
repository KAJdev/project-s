from datetime import datetime, UTC
from uuid import UUID, uuid4
from dotenv import load_dotenv
from os import getenv
from modules.utils import print, generate_id

load_dotenv()

import asyncio
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

from beanie import Document, Indexed, init_beanie, Link, BackLink

client = None


def convert_dates_to_iso(d):
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat() + "Z"
    return d


class User(Document):
    id: str = Field(default_factory=generate_id)
    username: str
    password: str
    token: str
    email: Optional[str]
    avatar_id: Optional[str]
    banner_id: Optional[str]
    bio: Optional[str]
    created_at: datetime
    prestige: int
    games: int
    wins: int

    def dict(self):
        d = super().dict()
        return convert_dates_to_iso(d)

    class Settings:
        name = "users"


class GameSettings(BaseModel):
    max_players: int


class Game(Document):
    id: str = Field(default_factory=generate_id)
    name: str
    members: list[str]
    created_at: datetime
    owner: str
    password: Optional[str]
    settings: GameSettings

    def dict(self):
        d = super().dict()
        return convert_dates_to_iso(d)

    class Settings:
        name = "games"


class Player(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    user: str

    def dict(self):
        d = super().dict()
        return convert_dates_to_iso(d)

    class Settings:
        name = "players"


class Message(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    author: str
    recipient: Optional[str]  # None if global within game
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    def dict(self):
        d = super().dict()
        return convert_dates_to_iso(d)

    class Settings:
        name = "messages"


async def init():
    global client
    client = AsyncIOMotorClient(getenv("MONGO_URL"))
    await init_beanie(
        database=client[getenv("ENV")], document_models=[User, Game, Player, Message]
    )
    print("Connected to MongoDB", important=True)
