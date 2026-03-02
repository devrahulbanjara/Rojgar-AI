import sys
from loguru import logger
from app.core.config import settings


def setup_logging() -> None:
    logger.remove()  # remove default handler
    logger.add(
        sys.stdout,
        level="DEBUG" if settings.debug else "INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> - {message}",
        colorize=True,
    )
    if not settings.debug:
        logger.add(
            "logs/app.log",
            rotation="10 MB",
            retention="30 days",
            level="INFO",
            compression="zip",
        )
