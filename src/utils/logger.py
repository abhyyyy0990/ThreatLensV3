"""ThreatLens structured logger.

Usage:
    from src.utils.logger import get_logger
    log = get_logger(__name__)
    log.info("event", extra={"scan_id": "...", "model_version": "..."})

Rules:
- Never log API keys, tokens, or full email bodies.
- Always use scan_id / event-type identifiers.
"""

import logging
import sys


def get_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Return a module-level logger with a consistent format.

    Args:
        name: usually ``__name__`` of the calling module.
        level: log level string, e.g. "INFO", "DEBUG".

    Returns:
        Configured :class:`logging.Logger`.
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # already configured

    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper(), logging.INFO))

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(fmt)
    logger.addHandler(handler)
    logger.propagate = False
    return logger
