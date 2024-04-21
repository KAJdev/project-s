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
    avatar_id: Optional[str] = Field(default=None)
    banner_id: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    prestige: int = Field(default=0)
    games: int = Field(default=0)
    wins: int = Field(default=0)

    def dict(self):
        d = super().model_dump(exclude={"password"})
        return convert_dates_to_iso(d)

    class Settings:
        name = "users"


class GameSettings(BaseModel):
    max_players: int = Field(default=8)
    star_victory_percentage: int = Field(default=51)
    stars_per_player: int = Field(default=24)
    production_cycle_length: int = Field(default=24)  # production cycle length in hours
    trading_level_cost: int = Field(default=15)  # cost to trade per level
    carrier_speed: float = Field(
        default=0.3333
    )  # carrier speed in light years per hour
    warp_speed: float = Field(default=3)  # warp speed multiplier

    # starting star values
    starting_stars: int = Field(default=6)
    starting_cash: int = Field(default=500)
    starting_ships: int = Field(default=10)  # starting ships per star
    starting_economy: int = Field(default=5)  # starting economy for player's home star
    starting_industry: int = Field(
        default=5
    )  # starting industry for player's home star
    starting_science: int = Field(default=1)  # starting science for player's home star

    # starting tech values
    starting_terraforming: int = Field(default=1)
    starting_experimentation: int = Field(default=1)
    starting_scanning: int = Field(default=1)
    starting_hyperspace: int = Field(default=1)
    starting_manufacturing: int = Field(default=1)
    starting_banking: int = Field(default=1)
    starting_weapons: int = Field(default=1)

    # research costs per level
    terraforming_cost: int = Field(default=144)
    experimentation_cost: int = Field(default=144)
    scanning_cost: int = Field(default=144)
    hyperspace_cost: int = Field(default=144)
    manufacturing_cost: int = Field(default=144)
    banking_cost: int = Field(default=144)
    weapons_cost: int = Field(default=144)


class Position(BaseModel):
    x: float
    y: float


class Game(Document):
    id: str = Field(default_factory=generate_id)
    name: str
    owner: str
    members: list[Link["Player"]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    started_at: Optional[datetime] = Field(default=None)
    winner: Optional[str] = Field(
        default=None
    )  # winner of the game, None if not finished
    password: Optional[str] = Field(default=None)
    settings: GameSettings

    def dict(self):
        d = super().model_dump(exclude={"password"})
        return convert_dates_to_iso(d)

    class Settings:
        name = "games"


class Research(BaseModel):
    scanning: int = Field(default=1)
    hyperspace: int = Field(default=1)
    terraforming: int = Field(default=1)
    experimentation: int = Field(default=1)
    weapons: int = Field(default=1)
    banking: int = Field(default=1)
    manufacturing: int = Field(default=1)


class Player(Document):
    id: str = Field(default_factory=generate_id)
    name: str
    game: BackLink[Game]
    user: str
    color: str

    # research progress
    research_queue: list[str] = Field(default_factory=list)
    research: Research = Field(default_factory=Research)

    def dict(self):
        d = super().model_dump()
        return convert_dates_to_iso(d)

    class Settings:
        name = "players"


class Message(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    author: str
    recipient: Optional[str] = Field(default=None)  # None if global within game
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    def dict(self):
        d = super().model_dump()
        return convert_dates_to_iso(d)

    class Settings:
        name = "messages"


class Star(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    position: Position
    name: str
    occupier: Optional[str] = Field(default=None)
    ships: int = Field(default=0)
    ship_accum: float = Field(
        default=0
    )  # ship accumulation, once it reaches 1, a ship is added
    economy: int = Field(default=0)
    industry: int = Field(default=0)
    science: int = Field(default=0)
    resources: int = Field(default=0)
    warp_gate: bool = Field(default=False)

    def get_economy_upgrade_cost(self, terraforming_level: int = 1):
        return (2.5 * 2 * (self.economy + 1)) / (
            (self.resources + (5 * terraforming_level)) / 100
        )

    def get_industry_upgrade_cost(self, terraforming_level: int = 1):
        return (5 * 2 * (self.industry + 1)) / (
            (self.resources + (5 * terraforming_level)) / 100
        )

    def get_science_upgrade_cost(self, terraforming_level: int = 1):
        return (20 * 2 * (self.science + 1)) / (
            (self.resources + (5 * terraforming_level)) / 100
        )

    def get_warp_gate_cost(self, terraforming_level: int = 1):
        return (50 * 2 * 100) / (self.resources + (5 * terraforming_level))

    def dict(self):
        d = super().model_dump()
        return convert_dates_to_iso(d)

    class Settings:
        name = "stars"


class Carrier(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    owner: str
    name: str
    position: Position
    destination_queue: list[str] = Field(default_factory=list)  # list of star ids
    ships: int = Field(default=0)

    def dict(self):
        d = super().model_dump()
        return d

    class Settings:
        name = "carriers"


async def init():
    global client
    client = AsyncIOMotorClient(getenv("MONGO_URL"))
    await init_beanie(
        database=client[getenv("ENV")],
        document_models=[User, Game, Player, Message, Star, Carrier],
    )
    print("Connected to MongoDB", important=True)
