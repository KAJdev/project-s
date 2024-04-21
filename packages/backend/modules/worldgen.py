import math
import random

from modules.db import Position


MIN_STAR_DISTANCE = 0.1
GALAXY_SIZE = 100
MAX_ITERATIONS = 10000


def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def generate_star_name() -> str:
    return "Star"


def generate_star_positions(
    player_count: int, stars_per_player: int
) -> tuple[list[Position], list[Position]]:
    player_stars: list[Position] = []
    stars: list[Position] = []
    iteration = 0

    # make some stars for the players exactly on the edge of the galaxy so they're evenly spaced
    for i in range(player_count):
        theta = i * 2 * 3.14159 / player_count
        x, y = GALAXY_SIZE * math.cos(theta), GALAXY_SIZE * math.sin(theta)
        player_stars.append(Position(x=x, y=y))

    while (
        len(stars) < player_count * (stars_per_player - 1)
        and iteration < MAX_ITERATIONS
    ):
        iteration += 1

        r = random.random() * GALAXY_SIZE
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
