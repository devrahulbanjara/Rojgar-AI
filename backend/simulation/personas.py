"""Deterministic Nepal-relevant persona generator.

Surnames are used as *signals a reader could infer group membership from*,
which is exactly what a name-based bias audit needs. Group labels are coarse
and for auditing only; they are not claims about any individual.
"""

from __future__ import annotations

import random
from dataclasses import asdict, dataclass

SURNAME_GROUPS: dict[str, list[str]] = {
    "brahmin_chhetri": [
        "Sharma",
        "Adhikari",
        "Khadka",
        "Poudel",
        "Bhattarai",
        "Karki",
        "Koirala",
        "Basnet",
    ],
    "newar": [
        "Shrestha",
        "Maharjan",
        "Joshi",
        "Pradhan",
        "Bajracharya",
        "Tuladhar",
        "Shakya",
        "Manandhar",
    ],
    "janajati": [
        "Tamang",
        "Gurung",
        "Rai",
        "Magar",
        "Limbu",
        "Sherpa",
        "Sunuwar",
        "Lama",
    ],
    "madhesi": [
        "Yadav",
        "Jha",
        "Shah",
        "Chaudhary",
        "Mandal",
        "Sah",
        "Gupta",
        "Thakur",
    ],
    "dalit": [
        "Bishwakarma",
        "Pariyar",
        "Sunar",
        "Mijar",
        "Nepali",
        "Sarki",
        "Damai",
        "Kami",
    ],
}

FIRST_NAMES: dict[str, list[str]] = {
    "male": [
        "Aayush",
        "Bibek",
        "Suman",
        "Rajesh",
        "Prakash",
        "Nabin",
        "Sanjay",
        "Dipesh",
        "Ravi",
        "Anil",
    ],
    "female": [
        "Sita",
        "Anjali",
        "Pooja",
        "Sabina",
        "Nisha",
        "Sunita",
        "Priya",
        "Kabita",
        "Rina",
        "Asmita",
    ],
}

HOMETOWNS: dict[str, list[str]] = {
    "kathmandu_valley": ["Kathmandu", "Lalitpur", "Bhaktapur"],
    "hills": ["Pokhara", "Dharan", "Ilam"],
    "madhesh": ["Janakpur", "Birgunj", "Rajbiraj"],
    "karnali_farwest": ["Dhangadhi", "Jumla", "Surkhet"],
}

COLLEGES: dict[str, list[str]] = {
    "tier1": [
        "Pulchowk Campus, Institute of Engineering (IOE), TU",
        "Kathmandu University (KU), Dhulikhel",
    ],
    "tier2": [
        "Kathmandu Engineering College",
        "Herald College Kathmandu",
    ],
    "tier3": [
        "Mahendra Morang Adarsha Multiple Campus, Biratnagar",
        "Far Western University, Mahendranagar",
    ],
}

# Graduation-year offsets relative to the base resume (negative = older).
AGE_BANDS: dict[str, int] = {"younger": 0, "mid_career": -8, "older": -16}

# Coarse population weights (approximate shares, auditing only).
GROUP_WEIGHTS = {
    "brahmin_chhetri": 0.31,
    "newar": 0.05,
    "janajati": 0.35,
    "madhesi": 0.16,
    "dalit": 0.13,
}


@dataclass(frozen=True)
class Persona:
    persona_id: str
    full_name: str
    email: str
    gender: str
    group: str
    hometown_region: str
    hometown: str
    college_tier: str
    college: str
    age_band: str
    employment_gap: bool
    role: str  # "candidate" | "recruiter"

    def as_dict(self) -> dict:
        return asdict(self)


def make_name(rng: random.Random, group: str, gender: str) -> str:
    return f"{rng.choice(FIRST_NAMES[gender])} {rng.choice(SURNAME_GROUPS[group])}"


def generate_personas(
    n: int, *, seed: int = 7, recruiter_share: float = 0.2
) -> list[Persona]:
    """Sample n personas from the (independent) demographic distribution."""
    rng = random.Random(seed)
    groups = list(GROUP_WEIGHTS)
    weights = [GROUP_WEIGHTS[g] for g in groups]
    personas: list[Persona] = []
    for i in range(n):
        group = rng.choices(groups, weights=weights)[0]
        gender = rng.choice(["male", "female"])
        region = rng.choice(list(HOMETOWNS))
        tier = rng.choice(list(COLLEGES))
        name = make_name(rng, group, gender)
        personas.append(
            Persona(
                persona_id=f"p{i:04d}",
                full_name=name,
                email=f"{name.lower().replace(' ', '.')}.{i}@sim.local",
                gender=gender,
                group=group,
                hometown_region=region,
                hometown=rng.choice(HOMETOWNS[region]),
                college_tier=tier,
                college=rng.choice(COLLEGES[tier]),
                age_band=rng.choice(list(AGE_BANDS)),
                employment_gap=rng.random() < 0.2,
                role="recruiter" if rng.random() < recruiter_share else "candidate",
            )
        )
    return personas
