import math
import random

from modules.db import Position, distance
from modules.utils import (
    GREEK_LETTERS,
    CONSTELLATIONS,
    STAR_NAME_PARTS,
    CARRIER_NAME_PARTS,
)


MIN_STAR_DISTANCE = 8
GALAXY_SIZE = 50
MAX_ITERATIONS = 10000


def generate_star_name() -> str:
    name_type = random.choice(["bayer", "flamsteed", "catalogue", "proper"])

    if name_type == "bayer":
        return f"{random.choice(GREEK_LETTERS)} {random.choice(CONSTELLATIONS)}"

    if name_type == "flamsteed":
        return f"{random.randint(1, 100)} {random.choice(CONSTELLATIONS)}"

    if name_type == "catalogue":
        return f"NGC {random.randint(1, 10000)} {random.choice(CONSTELLATIONS)}"

    if name_type == "proper":
        return f"{random.choice(STAR_NAME_PARTS['prefix'])}{''.join(random.choices(STAR_NAME_PARTS['middle'], k=2))}{random.choice(STAR_NAME_PARTS['suffix'])}"


def generate_carrier_name(seed: int) -> str:
    # pick a prefix based on the seed (dont use random) (the seed will probably be a color hex code or something)
    prefix = CARRIER_NAME_PARTS["prefix"][seed % len(CARRIER_NAME_PARTS["prefix"])]

    # pick a random middle
    middle = random.choice([*CARRIER_NAME_PARTS["middle"], *CONSTELLATIONS])

    return f"{prefix} {middle}"


def generate_star_positions(
    player_count: int, stars_per_player: int
) -> tuple[list[Position], list[Position]]:
    player_stars: list[Position] = []
    stars: list[Position] = []
    iteration = 0

    # make some stars for the players exactly on the edge of the galaxy so they're evenly spaced
    for i in range(player_count):
        theta = i * (2 * 3.14159) / player_count
        x, y = GALAXY_SIZE / 2 * math.cos(theta), GALAXY_SIZE / 2 * math.sin(theta)
        player_stars.append(Position(x=x, y=y))

    while (
        len(stars) < player_count * (stars_per_player - 1)
        and iteration < MAX_ITERATIONS
    ):
        iteration += 1

        r = math.sqrt(random.random()) * GALAXY_SIZE / 2
        theta = random.random() * 2 * 3.14159

        x, y = r * math.cos(theta), r * math.sin(theta)

        if not any(
            distance((x, y), (star.x, star.y)) < MIN_STAR_DISTANCE
            for star in [*stars, *player_stars]
        ):
            stars.append(Position(x=x, y=y))

    if iteration >= MAX_ITERATIONS:
        raise Exception("Failed to generate star positions. You're kinda boned ngl.")

    return stars, player_stars
