from functools import lru_cache

from langchain_aws import ChatBedrockConverse

from app.core.config import settings


@lru_cache(maxsize=1)
def get_bedrock_llm() -> ChatBedrockConverse:
    return ChatBedrockConverse(
        model=settings.aws_bedrock_shortlisting_model_id,
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id_shortlisting,
        aws_secret_access_key=settings.aws_secret_access_key_shortlisting,
        temperature=settings.aws_bedrock_shortlisting_temperature,
        max_tokens=settings.aws_bedrock_shortlisting_max_tokens,
    )
