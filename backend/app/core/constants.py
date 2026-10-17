"""Product constants shared by several modules.

Settings (core/config.py) hold only what differs per deployment or is a
secret. Fixed product values live next to the one module that uses them, or
here when several do.
"""

from zoneinfo import ZoneInfo

# Shown to applicants and businesses in emails and texts (frontend: lib/brand.ts).
PRODUCT_NAME = "Rojgar AI"
API_TITLE = "Rojgar AI API"
API_VERSION = "1.0.0"

# Signed tokens (sessions, status links, sign-up links).
JWT_ALGORITHM = "HS256"

# Nepal: "today", billing months and interview times default to this zone.
DEFAULT_TIMEZONE = "Asia/Kathmandu"
DEFAULT_TZ = ZoneInfo(DEFAULT_TIMEZONE)

# Largest CV upload (PDF or photo).
MAX_CV_BYTES = 10 * 1024 * 1024
