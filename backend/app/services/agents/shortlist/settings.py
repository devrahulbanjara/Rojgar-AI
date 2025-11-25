from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent
RESUMES_DIR = BASE_DIR / "resumes"
OUTPUT_DIR = BASE_DIR / "output"
JOB_DESCRIPTION_FILE = "job_description.txt"

LLM_MODEL = "llama-3.1-8b-instant"
LLM_TEMPERATURE = 0
LLM_MAX_TOKENS = 500
LLM_MAX_RETRIES = 3

SCORE_WEIGHTS = {
    "skills": 0.20,
    "experience_years": 0.20,
    "work_alignment": 0.30,
    "projects": 0.20,
    "qualification": 0.10,
}

SHORTLIST_THRESHOLD = 70.0

DEGREE_WEIGHTS = {
    "Computer Engineering": 10,
    "CSIT": 9,
    "BIT": 8,
    "BBS": 4,
    "Others": 5,
}

DEGREE_CATEGORIES = ["Computer Engineering", "CSIT", "BIT", "BBS", "Others"]

SUPPORTED_RESUME_FORMATS = [".txt", ".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"]

REPORT_JSON = "shortlist_report.json"
REPORT_SUMMARY = "shortlist_summary.txt"

RESUMES_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)