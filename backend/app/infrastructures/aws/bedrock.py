from functools import lru_cache

from langchain_aws import ChatBedrockConverse
from pydantic import SecretStr

from app.core.config import settings


def _credentials() -> tuple[SecretStr | None, SecretStr | None]:
    access = settings.aws_access_key_id_shortlisting
    secret = settings.aws_secret_access_key_shortlisting
    return (
        SecretStr(access) if access is not None else None,
        SecretStr(secret) if secret is not None else None,
    )


@lru_cache(maxsize=1)
def get_bedrock_llm() -> ChatBedrockConverse:
    """Bedrock chat model used when settings.review_provider == "bedrock"."""
    access, secret = _credentials()
    return ChatBedrockConverse(
        model=settings.review_bedrock_model_id,
        region_name=settings.aws_region,
        aws_access_key_id=access,
        aws_secret_access_key=secret,
        temperature=0.0,
        max_tokens=1500,
    )
