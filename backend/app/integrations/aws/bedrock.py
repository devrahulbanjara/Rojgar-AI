from langchain_aws import ChatBedrockConverse

from app.core.config import settings


def get_bedrock_llm():
    return ChatBedrockConverse(
        model_id=settings.BEDROCK_MODEL_ID,
        region_name=settings.AWS_REGION,
        temperature=settings.LLM_TEMPERATURE,
    )
