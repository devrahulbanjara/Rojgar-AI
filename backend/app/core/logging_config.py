import sys
from pathlib import Path

from loguru import logger

logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    colorize=True,
)


def configure_file_logging(log_dir: Path, filename: str = "app.log") -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / filename
    logger.add(
        log_path,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="TRACE",
        rotation="10 MB",
        retention="7 days",
        compression="zip",
    )


def get_logger(name: str = None):
    return logger.bind(name=name) if name else logger
