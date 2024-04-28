import math
import random

from modules.db import Position, distance


MIN_STAR_DISTANCE = 0.8
GALAXY_SIZE = 30
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

STAR_NAME_PARTS = {
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

CARRIER_NAME_PARTS = {
    "prefix": [
        "BIS",
        "SCF",
        "GAL",
        "FED",
        "UNI",
        "ALL",
        "COR",
        "SOL",
        "SUN",
        "COS",
        "AST",
        "LUN",
        "MIL",
        "DE",
        "RE",
        "IM",
        "EX",
        "INT",
    ],
    "middle": [
        # greek letters
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
        # gods
        "Zeus",
        "Hera",
        "Poseidon",
        "Demeter",
        "Athena",
        "Apollo",
        "Artemis",
        "Ares",
        "Aphrodite",
        "Hermes",
        "Hephaestus",
        "Hestia",
        "Dionysus",
        "Hades",
        "Persephone",
        "Heracles",
        # planets
        "Mercury",
        "Venus",
        "Earth",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto",
        "Ceres",
        "Eris",
        "Haumea",
    ],
}


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
