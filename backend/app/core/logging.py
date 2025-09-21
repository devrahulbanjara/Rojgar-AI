"""
Logging configuration for the application
"""

import logging
import sys
from typing import Any, Dict

from app.core.config import settings


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for different log levels"""

    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logging() -> None:
    """Setup application logging configuration"""

    # Create logger
    logger = logging.getLogger("convexhire")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

    # Create formatter
    if settings.ENVIRONMENT == "development":
        formatter: logging.Formatter = ColoredFormatter(
            fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Prevent duplicate logs
    logger.propagate = False


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for the given name"""
    return logging.getLogger(f"convexhire.{name}")


class LoggerMixin:
    """Mixin class to add logging capabilities to any class"""

    @property
    def logger(self) -> logging.Logger:
        """Get logger for this class"""
        return get_logger(self.__class__.__name__)
