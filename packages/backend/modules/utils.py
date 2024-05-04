og_print = print
import inspect
import math
from os import getenv
from uuid import uuid4
import aiohttp
from sanic import Request
import base64
from datetime import datetime
import os
import json
from modules.gateway import GatewayOpCode


def generate_id():
    return str(uuid4())


def print(*args, important=False, **kwargs):
    stack = inspect.stack()
    caller_frame = stack[1]
    frame_info = inspect.getframeinfo(caller_frame[0])
    mod = frame_info.filename.split(".")[0].split("/")[-1].split("\\")[-1]
    og_print(
        f"--->" if important else "    ",
        f"[{mod}]",
        *args,
        **kwargs,
    )


def internal_auth(request: Request) -> bool:
    if not (internal_token := request.headers.get("Authorization")):
        return False

    return internal_token == getenv("INTERNAL_TOKEN")


def generate_token(id_: str) -> str:
    b64id = base64.b64encode(id_.encode()).decode()
    timestampb64 = (
        base64.b64encode(str(int(datetime.utcnow().timestamp())).encode())
        .decode()
        .rstrip("=")
    )
    randomness = base64.b64encode(os.urandom(18)).decode()

    return f"{b64id}.{timestampb64}.{randomness}"


def deconstruct_token(token: str) -> tuple[str, int, str]:
    b64id, timestampb64, randomness = token.split(".")
    id_ = base64.b64decode(b64id).decode()
    timestamp = int(base64.b64decode(timestampb64 + "==").decode())

    return id_, timestamp, randomness


def wh_msg(type: GatewayOpCode, data: dict | None = None) -> str:
    return json.dumps(
        {
            "op": type.value,
            "d": data if data is not None else {},
        }
    )


def from_wh(msg: str) -> tuple[GatewayOpCode, dict]:
    try:
        msg = json.loads(msg)
    except json.JSONDecodeError:
        return GatewayOpCode.INVALID, {}

    try:
        op = GatewayOpCode(msg["op"])
    except KeyError:
        return GatewayOpCode.INVALID, {}

    return op, msg.get("d", {})


async def gpt(
    sys_prompt: str,
    msgs: list[tuple[str, str]],
    temperature: float = 1,
    max_tokens: int = 1024,
) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {getenv('OPENAI_TOKEN')}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4",
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    *[{"role": m[0], "content": m[1]} for m in msgs],
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        ) as resp:
            data = await resp.json()
            completion = data["choices"][0]["message"]["content"]
            return completion


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
