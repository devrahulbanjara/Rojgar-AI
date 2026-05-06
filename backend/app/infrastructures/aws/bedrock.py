from functools import lru_cache

from langchain_aws import ChatBedrockConverse
from pydantic import SecretStr

from app.core.config import settings


def _credentials() -> tuple[SecretStr | None, SecretStr | None]:
    access = (
        SecretStr(settings.aws_access_key_id_shortlisting)
        if settings.aws_access_key_id_shortlisting is not None
        else None
    )
    secret = (
        SecretStr(settings.aws_secret_access_key_shortlisting)
        if settings.aws_secret_access_key_shortlisting is not None
        else None
    )
    return access, secret


@lru_cache(maxsize=1)
def get_bedrock_llm() -> ChatBedrockConverse:
    """Return the primary Bedrock chat model used by CTO/HR/critique nodes."""
    access, secret = _credentials()
    return ChatBedrockConverse(
        model=settings.aws_bedrock_shortlisting_model_id,
        region_name=settings.aws_region,
        aws_access_key_id=access,
        aws_secret_access_key=secret,
        temperature=settings.aws_bedrock_shortlisting_temperature,
        max_tokens=settings.aws_bedrock_shortlisting_max_tokens,
    )


@lru_cache(maxsize=1)
def get_bedrock_merge_llm() -> ChatBedrockConverse:
    """Return the cheaper Bedrock model used by the final merge node."""
    access, secret = _credentials()
    return ChatBedrockConverse(
        model=settings.aws_bedrock_shortlisting_merge_model_id,
        region_name=settings.aws_region,
        aws_access_key_id=access,
        aws_secret_access_key=secret,
        temperature=settings.aws_bedrock_shortlisting_temperature,
        max_tokens=settings.aws_bedrock_shortlisting_merge_max_tokens,
    )
