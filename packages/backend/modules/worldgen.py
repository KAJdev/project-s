import math
import random

from modules.db import Position, distance
from modules.utils import (
    GREEK_LETTERS,
    CONSTELLATIONS,
    STAR_NAME_PARTS,
    CARRIER_NAME_PARTS,
)


GALAXY_SIZE_PER_STAR = 2
STARS_PER_PLAYER = 5
MAX_SYSTEM_SIZE = 10
MIN_SYSTEM_SIZE = 3
MAX_ITERATIONS = 100000


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
    player_count: int, stars_per_player: int, starting_system_size: int = 6
) -> tuple[list[tuple[Position, int]], list[Position]]:
    player_stars: list[Position] = []
    stars: list[tuple[Position, int]] = []
    iteration = 0

    galaxy_size = GALAXY_SIZE_PER_STAR * player_count * STARS_PER_PLAYER

    # make some stars for the players exactly on the edge of the galaxy so they're evenly spaced
    for i in range(player_count):
        theta = i * (2 * 3.14159) / player_count
        x, y = galaxy_size / 2 * math.cos(theta), galaxy_size / 2 * math.sin(theta)
        player_stars.append(Position(x=x, y=y))

    while (
        len(stars) < player_count * (STARS_PER_PLAYER - 1)
        and iteration < MAX_ITERATIONS
    ):
        iteration += 1

        # chose a star and create a new star off of that
        all_stars = [*[(s, starting_system_size) for s in player_stars], *stars]
        star_pos, star_size = random.choice(all_stars)

        new_system_size = random.randint(MIN_SYSTEM_SIZE, MAX_SYSTEM_SIZE)

        theta = random.random() * 2 * 3.14159

        # point a bit towards the center
        theta += math.atan2(-star_pos.y, -star_pos.x) * 0.5

        d = new_system_size + star_size

        x, y = star_pos.x + d * math.cos(theta), star_pos.y + d * math.sin(theta)

        # check if the new star is too close to any other star
        if any(
            distance(Position(x=x, y=y), star[0]) < new_system_size + star[1]
            for star in all_stars
        ):
            continue

        stars.append((Position(x=x, y=y), new_system_size))

    if iteration >= MAX_ITERATIONS:
        raise Exception("Failed to generate star positions. You're kinda boned ngl.")

    return stars, player_stars
