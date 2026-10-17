"""Guard for scripts that wipe or seed data stores.

Seed and reset scripts drop tables, delete collections and create accounts
with a shared default password. They must never run against production by
accident, so they refuse unless every target is local, or the operator passes
the explicit override flag.
"""

import sys
from urllib.parse import urlparse

from app.core.config import settings

OVERRIDE_FLAG = "--i-know-what-im-doing"
_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "postgres", "postgres-test"}
_LOCAL_QDRANT_HOSTS = _LOCAL_HOSTS | {"qdrant", "qdrant-test"}


def assert_local_target(script: str, *, check_qdrant: bool = False) -> None:
    """Exit unless the configured data stores are local and env is not prod."""
    if OVERRIDE_FLAG in sys.argv:
        print(f"[{script}] {OVERRIDE_FLAG} given — skipping safety checks.")
        return

    problems = []
    if settings.environment == "prod":
        problems.append("ENVIRONMENT is 'prod'")
    if settings.db_host not in _LOCAL_HOSTS:
        problems.append(f"DB_HOST '{settings.db_host}' is not local")
    if check_qdrant:
        qdrant_host = urlparse(settings.qdrant_url).hostname or ""
        if qdrant_host not in _LOCAL_QDRANT_HOSTS:
            problems.append(f"QDRANT_URL host '{qdrant_host}' is not local")

    if problems:
        sys.exit(
            f"[{script}] Refusing to run: {'; '.join(problems)}.\n"
            f"This script deletes or seeds data. Re-run with {OVERRIDE_FLAG} "
            "only if you are sure the target is disposable."
        )
