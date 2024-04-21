from datetime import datetime, UTC
from enum import Enum
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


class Technology:
    scanning = "scanning"
    hyperspace = "hyperspace"
    terraforming = "terraforming"
    experimentation = "experimentation"
    weapons = "weapons"
    banking = "banking"
    manufacturing = "manufacturing"


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
    game: str
    user: str
    color: str

    cash: float = Field(default=0)

    # research progress
    research_queue: list[str] = Field(default_factory=lambda: [Technology.hyperspace])
    research_levels: Research = Field(default_factory=Research)
    research_points: Research = Field(
        default_factory=lambda: Research(**{k: 0 for k in Research.model_fields.keys()})
    )

    def get_scan_distance(self) -> int:
        return 2 + self.research_levels.scanning

    def dict(self):
        d = super().model_dump()
        d["cash"] = int(d["cash"])
        return convert_dates_to_iso(d)

    def dict_not_self(self):
        d = super().model_dump()
        for k in ("research_queue", "research_points", "cash"):
            del d[k]
        d["cash"] = int(d["cash"])
        return convert_dates_to_iso(d)

    def do_research(self, game: Game, stars: list["Star"]):
        if not self.research_queue:
            self.research_queue = [Technology.hyperspace]

        science = sum(s.science for s in stars if s.occupier == self.id)
        current_tech = self.research_queue[0]
        setattr(
            self.research_points,
            current_tech,
            getattr(self.research_points, current_tech) + science,
        )
        points_to_next_level = getattr(self.research_levels, current_tech) * getattr(
            game.settings, f"{current_tech}_cost"
        )
        excess = getattr(self.research_points, current_tech) - points_to_next_level

        if excess >= 0:
            setattr(
                self.research_levels,
                current_tech,
                getattr(self.research_levels, current_tech) + 1,
            )
            setattr(self.research_points, current_tech, excess)
            if len(self.research_queue) > 1:
                self.research_queue.pop(0)

    def do_economy(self, stars: list["Star"]):
        for star in stars:
            if star.occupier == self.id:
                self.cash += (
                    star.economy / 0.25 / 60
                )  # because we are running this every minute

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

    def dict_unscanned(self):
        d = super().model_dump()
        for k in (
            "economy",
            "industry",
            "science",
            "resources",
            "warp_gate",
            "ships",
            "ship_accum",
        ):
            del d[k]
        return convert_dates_to_iso(d)

    def do_production(self, game: Game):
        """
        Produces ships via industry * (occupier.manufacturing + 5) / game production length
        """
        if not self.occupier:
            return

        owner = next(p for p in game.members if p.id == self.occupier)
        if not owner:
            return

        self.ship_accum += (
            self.industry
            * (owner.research_levels.manufacturing + 5)
            / game.settings.production_cycle_length
            / 60  # because we are running this every minute
        )
        self.ships += int(self.ship_accum)
        self.ship_accum -= int(self.ship_accum)

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

    def move(self, game: Game, stars: list[Star]):
        if not self.destination_queue:
            return

        destination = next(s for s in stars if s.id == self.destination_queue[0])

        distance = distance(
            (self.position.x, self.position.y),
            (destination.position.x, destination.position.y),
        )

        speed = game.settings.carrier_speed
        if destination.warp_gate:
            speed = game.settings.warp_speed

        speed = speed / 60  # because we are running this every minute

        if distance <= speed:
            self.position = destination.position
            self.destination_queue.pop(0)
        else:
            self.position.x += (
                (destination.position.x - self.position.x) / distance * speed
            )
            self.position.y += (
                (destination.position.y - self.position.y) / distance * speed
            )

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
