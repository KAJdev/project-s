import math
import random
import asyncio

from modules.db import Position, distance
from modules.utils import (
    GREEK_LETTERS,
    CONSTELLATIONS,
    STAR_NAME_PARTS,
    CARRIER_NAME_PARTS,
)


GALAXY_SIZE_PER_STAR = 2.5
MIN_STAR_DISTANCE = 10


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


def system_gen_worker(
    player_count: int, stars_per_player: int, starting_system_size: int
) -> tuple[list[tuple[Position, int]], list[Position]]:
    player_stars: list[Position] = []
    star_positions: list[Position] = []

    galaxy_size = GALAXY_SIZE_PER_STAR * player_count * stars_per_player

    # make some stars for the players exactly on the edge of the galaxy so they're evenly spaced
    for i in range(player_count):
        theta = i * (2 * 3.14159) / player_count
        x, y = galaxy_size / 2 * math.cos(theta), galaxy_size / 2 * math.sin(theta)
        player_stars.append(Position(x=x, y=y))

    # generate points on a grid, only only within the galaxy, then shuffle them
    for x in range(
        -int(galaxy_size / 2),
        int(galaxy_size / 2),
        MIN_STAR_DISTANCE,
    ):
        for y in range(-int(galaxy_size / 2), int(galaxy_size / 2), MIN_STAR_DISTANCE):
            pos = Position(
                x=x
                + random.random() * (MIN_STAR_DISTANCE / 1.8)
                - MIN_STAR_DISTANCE / 2,
                y=y
                + random.random() * (MIN_STAR_DISTANCE / 1.8)
                - MIN_STAR_DISTANCE / 2,
            )
            if (
                distance(pos, Position(x=0, y=0)) < galaxy_size / 2
                and any(
                    distance(pos, star) < starting_system_size + 2
                    for star in player_stars
                )
                is False
            ):
                star_positions.append(pos)

    # go through and create system sized
    star_sizes: list[int | None] = [None] * len(star_positions)

    all_stars = player_stars + star_positions

    for i in range(len(star_positions)):
        star_dist = 9999999
        for j, star in enumerate(all_stars):
            if i == j - player_count:
                continue

            other_star_size = (
                (
                    star_sizes[j - player_count]
                    or (distance(star_positions[i], star) / 2)
                )
                if j >= player_count
                else starting_system_size
            )
            dist = int(max(0, distance(star_positions[i], star) - other_star_size))

            if dist < star_dist:
                star_dist = dist

        star_sizes[i] = star_dist

    return zip(star_positions, star_sizes), player_stars


async def generate_star_positions(
    player_count: int, stars_per_player: int, starting_system_size: int = 6
) -> tuple[list[tuple[Position, int]], list[Position]]:
    # this is a blocking function, so we need to run it in a thread
    return await asyncio.to_thread(
        system_gen_worker, player_count, stars_per_player, starting_system_size
    )
