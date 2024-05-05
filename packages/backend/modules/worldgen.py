import math
import random

from modules.db import Position, distance
from modules.utils import (
    GREEK_LETTERS,
    CONSTELLATIONS,
    STAR_NAME_PARTS,
    CARRIER_NAME_PARTS,
)


GALAXY_SIZE_PER_STAR = 2.5
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
    star_positions: list[Position] = []
    iteration = 0

    galaxy_size = GALAXY_SIZE_PER_STAR * player_count * stars_per_player

    # make some stars for the players exactly on the edge of the galaxy so they're evenly spaced
    for i in range(player_count):
        theta = i * (2 * 3.14159) / player_count
        x, y = galaxy_size / 2 * math.cos(theta), galaxy_size / 2 * math.sin(theta)
        player_stars.append(Position(x=x, y=y))

    while (
        len(star_positions) < player_count * (stars_per_player - 1)
        and iteration < MAX_ITERATIONS
    ):
        iteration += 1

        r = math.sqrt(random.random()) * galaxy_size / 2
        theta = random.random() * 2 * 3.14159

        x, y = r * math.cos(theta), r * math.sin(theta)

        # make sure its >starting_size+1 units away from a player star
        if any(
            distance(Position(x=x, y=y), star) < starting_system_size + 1
            for star in player_stars
        ):
            continue

        star_positions.append(Position(x=x, y=y))

    if iteration >= MAX_ITERATIONS:
        raise Exception("Failed to generate star positions. You're kinda boned ngl.")

    # go through and create system sized
    stars: list[tuple[Position, int]] = []

    all_stars = player_stars + star_positions

    # find mutual closest stars and set system size to be the distance between them/2
    # keep in mind that for i < len(player_stars), must be a player star and size must be starting_system_size

    def close_lambda(i, j):
        d = distance(star_positions[i], all_stars[j])
        if d < 0.001:
            return 99999999
        return d

    for i in range(len(star_positions)):
        closest_index = min(
            range(len(all_stars)),
            key=lambda j: close_lambda(i, j),
        )

        stars.append((star_positions[i], int(close_lambda(i, closest_index) / 2)))

    return stars, player_stars
