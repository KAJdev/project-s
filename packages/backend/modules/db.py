from datetime import datetime, UTC
from enum import Enum
import math
import random
from uuid import UUID, uuid4
from dotenv import load_dotenv
from os import getenv
from modules.utils import STAR_NAME_PARTS, print, generate_id

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


def distance(a, b):
    if isinstance(a, Position):
        a = (a.x, a.y)
    if isinstance(b, Position):
        b = (b.x, b.y)
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


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
        use_state_management = True


class GameSettings(BaseModel):
    max_players: int = Field(default=8)
    victory_percentage: int = Field(default=51)
    stars_per_player: int = Field(default=4)
    production_cycle_length: int = Field(default=24)  # production cycle length in hours
    trading_level_cost: int = Field(default=15)  # cost to trade per level
    carrier_speed: float = Field(
        default=0.3333
    )  # carrier speed in light years per hour
    warp_speed: float = Field(default=3)  # warp speed multiplier

    # starting values
    starting_systems: int = Field(
        default=1
    )  # how many full systems to give to each player
    starting_system_size: int = Field(
        default=6
    )  # how many planets in the starting system for each player
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
        use_state_management = True


class Technology:
    scanning = "scanning"
    hyperspace = "hyperspace"
    terraforming = "terraforming"
    experimentation = "experimentation"
    weapons = "weapons"
    banking = "banking"
    manufacturing = "manufacturing"

    @staticmethod
    def all():
        return [
            Technology.scanning,
            Technology.hyperspace,
            Technology.terraforming,
            Technology.experimentation,
            Technology.weapons,
            Technology.banking,
            Technology.manufacturing,
        ]


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
    bio: Optional[str] = Field(default=None)

    cash: float = Field(default=0)

    # research progress
    research_queue: list[str] = Field(default_factory=lambda: [Technology.hyperspace])
    research_levels: Research = Field(default_factory=Research)
    research_points: Research = Field(
        default_factory=lambda: Research(**{k: 0 for k in Research.model_fields.keys()})
    )

    def get_scan_distance(self) -> int:
        return 2 + self.research_levels.scanning

    def get_hyperspace_distance(self) -> int:
        return 3 + self.research_levels.hyperspace

    def dict(self):
        d = super().model_dump()
        d["cash"] = int(d["cash"])
        return convert_dates_to_iso(d)

    def dict_not_self(self):
        d = super().model_dump()
        d["cash"] = int(d["cash"])
        for k in ("research_queue", "research_points", "cash"):
            del d[k]
        return convert_dates_to_iso(d)

    def do_research(self, game: Game, planets: list["Planet"]):
        if not self.research_queue:
            self.research_queue = [Technology.hyperspace]

        science = sum(p.science for p in planets if p.occupier == self.id)
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

    def do_economy(self, planets: list["Planet"]):
        for planet in planets:
            if planet.occupier == self.id:
                self.cash += (
                    planet.economy / 0.25 / 60
                )  # because we are running this every minute

    def do_production(self, planets: list["Planet"]):
        for planet in planets:
            if planet.occupier == self.id:
                self.cash += (
                    planet.economy * 10
                )  # because this runs every production cycle

    class Settings:
        name = "players"
        use_state_management = True


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
        use_state_management = True


class Star(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    position: Position
    name: str
    planets: list[Link["Planet"]] = Field(default_factory=list)

    def dict(self):
        d = super().model_dump(exclude={"planets"})
        return convert_dates_to_iso(d)

    def gen_system(self):
        for i in range(random.randint(1, 8)):
            planet = Planet(
                game=self.game,
                orbits=self.id,
                distance=(i + 1) + (random.random() * 0.5),
                name=Planet.generate_planet_name(self.name, i),
                occupier=None,
                resources=random.randint(1, 50),
            )

            planet.position = planet.get_position([self])

            self.planets.append(planet)

    def gen_player_system(self, game: Game, player: Player):
        for i in range(game.settings.starting_system_size):
            planet = Planet(
                game=self.game,
                orbits=self.id,
                distance=(i + 1) + (random.random() * 0.5),
                name=Planet.generate_planet_name(self.name, i),
                occupier=player.id,
                resources=40,
                economy=game.settings.starting_economy,
                industry=game.settings.starting_industry,
                science=game.settings.starting_science,
                ships=game.settings.starting_ships,
            )

            planet.position = planet.get_position([self])

            self.planets.append(planet)


class Planet(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    orbits: str
    distance: float
    theta: float = Field(default_factory=lambda: random.random() * math.pi * 2)
    position: Position = Field(default_factory=lambda: Position(x=0, y=0))
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

    def get_all_costs(self, terraforming_level: int = 1):
        return {
            "economy": self.get_economy_upgrade_cost(terraforming_level),
            "industry": self.get_industry_upgrade_cost(terraforming_level),
            "science": self.get_science_upgrade_cost(terraforming_level),
            "warp_gate": self.get_warp_gate_cost(terraforming_level),
        }

    def get_position(self, stars: list[Star]):
        star = next((s for s in stars if s.id == self.orbits), None)
        if not star:
            return None
        return Position(
            x=star.position.x + self.distance * math.cos(self.theta),
            y=star.position.y + self.distance * math.sin(self.theta),
        )

    def dict(self):
        d = super().model_dump()
        return convert_dates_to_iso(d)

    @staticmethod
    def generate_planet_name(star_name: str, i: int):
        name_type = random.choice(["indexed", "proper"])

        if name_type == "indexed":
            return f"{star_name} {chr(i + 98)}"

        if name_type == "proper":
            return f"{random.choice(STAR_NAME_PARTS['prefix'])}{''.join(random.choices(STAR_NAME_PARTS['middle'], k=2))}{random.choice(STAR_NAME_PARTS['suffix'])}"

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

    async def do_orbit(self, game: Game, stars: list[Star], carriers: list["Carrier"]):
        """
        orbit around star
        """
        star = next((s for s in stars if s.id == self.orbits), None)
        if not star:
            return

        orbit_speed = (game.settings.carrier_speed * 0.6) / 60

        # rotate around star by speed, make sure actual distance moved is based on speed, dont just rotate by speed
        r = distance(self.position, star.position)
        new_theta = self.theta + orbit_speed / r

        new_position = Position(
            x=star.position.x + r * math.cos(new_theta),
            y=star.position.y + r * math.sin(new_theta),
        )

        # find all the carriers currently on the planet
        carriers_on_planet = [
            c
            for c in carriers
            if distance(c.position, self.position) < 0.01
            and len(c.destination_queue) == 0
        ]

        # move the carriers
        save_tasks = []
        for carrier in carriers_on_planet:
            carrier.position.x = new_position.x
            carrier.position.y = new_position.y
            save_tasks.append(carrier.save_changes())

        if save_tasks:
            await asyncio.gather(*save_tasks)

        self.theta = new_theta
        self.position = new_position

    class Settings:
        name = "planets"
        use_state_management = True


class Destination(BaseModel):
    planet: str
    action: Optional[str] = Field(default="collect")  # collect, drop, None


class Carrier(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    owner: str
    name: str
    position: Position
    destination_queue: list[Destination] = Field(default_factory=list)
    ships: int = Field(default=0)

    def dict(self):
        d = super().model_dump()
        return d

    def dict_not_self(self):
        d = super().model_dump()
        if d["destination_queue"]:
            d["destination_queue"] = [d["destination_queue"][0]]
        return d

    async def move(self, game: Game, planets: list[Planet]):
        if not self.destination_queue:
            return

        try:
            destination = next(
                p for p in planets if p.id == self.destination_queue[0].planet
            )
        except StopIteration:
            # destination no longer exists
            self.destination_queue.pop(0)
            return

        distance_to_move = distance(
            (self.position.x, self.position.y),
            (destination.position.x, destination.position.y),
        )

        speed = game.settings.carrier_speed
        if destination.warp_gate:
            speed = game.settings.warp_speed

        speed = speed / 60  # because we are running this every minute

        if distance_to_move <= speed:
            self.position = destination.position
            popped = self.destination_queue.pop(0)

            if popped.action == "collect" and destination.occupier == self.owner:
                self.ships += destination.ships
                await destination.set({Planet.ships: 0})
            elif (
                popped.action == "drop"
                and self.ships > 1
                and destination.occupier == self.owner
            ):
                await destination.inc({Planet.ships: self.ships - 1})
                self.ships = 1

        else:
            direction = (
                (destination.position.x - self.position.x) / distance_to_move,
                (destination.position.y - self.position.y) / distance_to_move,
            )

            self.position.x += direction[0] * speed
            self.position.y += direction[1] * speed

    class Settings:
        name = "carriers"
        use_state_management = True


class CombatEvent(BaseModel):
    planet_id: str
    planet_name: str
    attacking_players: list[Link[Player]]
    defending_players: list[Link[Player]]
    attacker_ships: int
    defender_ships: int
    winner: str

    async def format(self):
        winner = "draw"

        # have to do beanie's job for them lmao
        try:
            to_fetch = list(
                filter(
                    lambda p: isinstance(p, Link),
                    [*self.attacking_players, *self.defending_players],
                )
            )
            fetched = await asyncio.gather(*[p.fetch() for p in to_fetch])

            #  replace fetched links with actual objects based on Link.ref.id and Player.id
            for p in fetched:
                for player in [*self.attacking_players, *self.defending_players]:
                    if isinstance(player, Link) and player.ref.id == p.id:
                        if player in self.attacking_players:
                            self.attacking_players.remove(player)
                            self.attacking_players.append(p)
                        else:
                            self.defending_players.remove(player)
                            self.defending_players.append(p)
                        break
        except Exception as e:
            print(f"Error fetching players: {e}")
            raise e

        if self.winner:
            for player in [*self.attacking_players, *self.defending_players]:
                if player.id == self.winner:
                    winner = player.name
                    break

        attacking = ", ".join([p.name for p in self.attacking_players]) or "Nobody"
        defending = ", ".join([p.name for p in self.defending_players]) or "Unoccupied"

        return "\n".join(
            [
                "type: combat",
                f"planet: {self.planet_name}",
                f"attacker{'s' if len(self.attacking_players) > 1 else ''}: {attacking} (with {self.attacker_ships} ships)",
                f"defender{'s' if len(self.defending_players) > 1 else ''}: {defending} (with {self.defender_ships} ships)",
                f"winner: {winner}",
            ]
        )


class ProductionEvent(BaseModel):
    total_cash_created: int

    async def format(self):
        return "\n".join(
            [
                "type: state of the galaxy",
                f"total taxes across all factions: {self.total_cash_created} credits",
            ]
        )


class StatementEvent(BaseModel):
    player: str
    player_name: str
    message: str

    async def format(self):
        return "\n".join(
            [
                "type: statement",
                f"state: {self.player_name}",
                f"message: {self.message}",
            ]
        )


class Event(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    data: CombatEvent | ProductionEvent | StatementEvent
    type: str

    def dict(self):
        d = super().model_dump()
        return convert_dates_to_iso(d)

    class Settings:
        name = "events"
        use_state_management = True


class News(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    title: str
    content: str
    outlet_name: str = Field(default="The Galactic News Network")
    tags: list[str] = Field(default_factory=list)

    def dict(self):
        d = super().model_dump()
        return convert_dates_to_iso(d)

    class Settings:
        name = "news"
        use_state_management = True


class PlayerCensus(BaseModel):
    player: str
    planets: int
    carriers: int
    cash: int
    ships: int
    industry: int
    economy: int
    science: int
    research_levels: Research

    def model_dump(self):
        d = super().model_dump(exclude={"cash"})
        return d


class Census(Document):
    id: str = Field(default_factory=generate_id)
    game: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    players: list[PlayerCensus] = Field(default_factory=list)

    def dict(self):
        d = super().model_dump()
        return convert_dates_to_iso(d)

    class Settings:
        name = "census"
        use_state_management = True


async def init():
    global client
    client = AsyncIOMotorClient(getenv("MONGO_URL"))
    await init_beanie(
        database=client[getenv("ENV")],
        document_models=[
            User,
            Game,
            Player,
            Message,
            Star,
            Carrier,
            Event,
            News,
            Planet,
            Census,
        ],
    )
    print("Connected to MongoDB", important=True)
