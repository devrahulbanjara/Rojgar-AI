import time

from app.core.logging_config import logger


def invoke_with_retry(model, messages, max_retries=3, base_delay=1.0):
    for attempt in range(max_retries):
        try:
            return model.invoke(messages)
        except Exception:
            if attempt < max_retries - 1:
                delay = base_delay * (2**attempt)
                logger.error(f"Error occurred, retrying in {delay}s...")
                time.sleep(delay)
            else:
                raise
    return None
