"""
Golden dataset generator for Rojgar AI resume extraction evaluation.

The implementation is intentionally split across smaller modules:
- `dataset_personas.py` for persona/reference data
- `dataset_prompts.py` for system and user prompts
- `dataset_rendering.py` for PDF rendering helpers
- `templates/` for style-specific HTML templates
- `dataset_generation.py` for orchestration
"""

from __future__ import annotations

import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


if __name__ == "__main__":
    from dataset_generation import main

    main()
