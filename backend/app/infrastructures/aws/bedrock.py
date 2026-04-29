from functools import lru_cache

from langchain_aws import ChatBedrockConverse
from pydantic import SecretStr

from app.core.config import settings


@lru_cache(maxsize=1)
def get_bedrock_llm() -> ChatBedrockConverse:
    """Return the Bedrock chat model used by the shortlisting workflow."""
    return ChatBedrockConverse(
        model=settings.aws_bedrock_shortlisting_model_id,
        region_name=settings.aws_region,
        aws_access_key_id=(
            SecretStr(settings.aws_access_key_id_shortlisting)
            if settings.aws_access_key_id_shortlisting is not None
            else None
        ),
        aws_secret_access_key=(
            SecretStr(settings.aws_secret_access_key_shortlisting)
            if settings.aws_secret_access_key_shortlisting is not None
            else None
        ),
        temperature=settings.aws_bedrock_shortlisting_temperature,
        max_tokens=settings.aws_bedrock_shortlisting_max_tokens,
    )
