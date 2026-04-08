"""
Regenerate backend/credentials.json from the seed source of truth.

Usage:
    uv run python export_credentials.py
"""

from seed_data import write_credentials_file


def main() -> None:
    credentials_path = write_credentials_file()
    print(f"Credentials exported to: {credentials_path}")


if __name__ == "__main__":
    main()
