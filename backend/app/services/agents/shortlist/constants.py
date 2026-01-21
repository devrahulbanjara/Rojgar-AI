SHORTLIST_THRESHOLD: float = 70.0

SCORE_WEIGHTS: dict[str, float] = {
    "skills": 0.20,
    "experience_years": 0.20,
    "work_alignment": 0.30,
    "projects": 0.20,
    "qualification": 0.10,
}

DEGREE_WEIGHTS: dict[str, int] = {
    "Computer Engineering": 10,
    "CSIT": 9,
    "BIT": 8,
    "STEM": 6,
    "Management": 3,
    "Others": 1,
}

DEGREE_CATEGORIES: list[str] = [
    "Computer Engineering",
    "CSIT",
    "BIT",
    "STEM",
    "Management",
    "Others",
]

SUPPORTED_RESUME_FORMATS: list[str] = [".pdf", ".docx"]


PII_ENTITIES: list[str] = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "LOCATION",
    "URL",
    "DATE_TIME",
    "ORGANIZATION",
    "NRP",
]
