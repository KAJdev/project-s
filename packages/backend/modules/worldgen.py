import math
import random

from modules.db import Position


MIN_STAR_DISTANCE = 0.1
GALAXY_SIZE = 100
MAX_ITERATIONS = 10000

GREEK_LETTERS = [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Rho",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega",
]

CONSTELLATIONS = [
    "Andromeda",
    "Antlia",
    "Apus",
    "Aquarius",
    "Aquila",
    "Ara",
    "Aries",
    "Auriga",
    "Bootes",
    "Caelum",
    "Camelopardalis",
    "Cancer",
    "Canes Venatici",
    "Canis Major",
    "Canis Minor",
    "Capricornus",
    "Carina",
    "Cassiopeia",
    "Centaurus",
    "Cepheus",
    "Cetus",
    "Chamaeleon",
    "Circinus",
    "Columba",
    "Coma Berenices",
    "Corona Australis",
    "Corona Borealis",
    "Corvus",
    "Crater",
    "Crux",
    "Cygnus",
    "Delphinus",
    "Dorado",
    "Draco",
    "Equuleus",
    "Eridanus",
    "Fornax",
    "Gemini",
    "Grus",
    "Hercules",
    "Horologium",
    "Hydra",
    "Hydrus",
    "Indus",
    "Lacerta",
    "Leo",
    "Leo Minor",
    "Lepus",
    "Libra",
    "Lupus",
    "Lynx",
    "Lyra",
    "Mensa",
    "Microscopium",
    "Monoceros",
    "Musca",
    "Norma",
    "Octans",
    "Ophiuchus",
    "Orion",
    "Pavo",
    "Pegasus",
    "Perseus",
    "Phoenix",
    "Pictor",
    "Pisces",
    "Piscis Austrinus",
    "Puppis",
    "Pyxis",
    "Reticulum",
    "Sagitta",
    "Sagittarius",
    "Scorpius",
    "Sculptor",
    "Scutum",
    "Serpens",
    "Sextans",
    "Taurus",
    "Telescopium",
    "Triangulum",
    "Triangulum Australe",
    "Tucana",
    "Ursa Major",
    "Ursa Minor",
    "Vela",
    "Virgo",
    "Volans",
    "Vulpecula",
]

NAME_PARTS = {
    "prefix": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
    ],
    "middle": [
        "a",
        "us",
        "ia",
        "on",
        "or",
        "is",
        "ar",
        "el",
        "an",
        "en",
        "ir",
        "ur",
        "st",
        "al",
        "il",
        "ol",
        "ul",
        "ad",
        "od",
        "ud",
        "at",
        "ot",
        "ut",
        "am",
        "em",
        "im",
        "um",
        "an",
        "en",
        "in",
        "un",
        "as",
        "es",
    ],
    "suffix": [
        " Majoris",
        " Minoris",
        " Prime",
        " Secundus",
        " Tertius",
        " Quartus",
        " Quintus",
        " Sextus",
        " Septimus",
        " Octavus",
        " Nonus",
        " Decimus",
        " XI",
        " XII",
        " XIII",
        " XIV",
        " XV",
        " XVI",
        " XVII",
        " XVIII",
        " XIX",
    ],
}


def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def generate_star_name() -> str:
    name_type = random.choice(["bayer", "flamsteed", "catalogue", "proper"])

    if name_type == "bayer":
        return f"{random.choice(GREEK_LETTERS)} {random.choice(CONSTELLATIONS)}"

    if name_type == "flamsteed":
        return f"{random.randint(1, 100)} {random.choice(CONSTELLATIONS)}"

    if name_type == "catalogue":
        return f"NGC {random.randint(1, 10000)} {random.choice(CONSTELLATIONS)}"

    if name_type == "proper":
        return f"{random.choice(NAME_PARTS['prefix'])}{''.join(random.choices(NAME_PARTS['middle'], k=2))}{random.choice(NAME_PARTS['suffix'])}"


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
