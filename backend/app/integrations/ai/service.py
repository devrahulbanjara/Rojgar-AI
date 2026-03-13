from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import settings


class AIService:
    """
    Encapsulates all AI/embedding third-party integrations.

    Swap Gemini for OpenAI, Cohere, or a local HuggingFace model here without
    touching any business logic elsewhere in the codebase.
    """

    def __init__(self) -> None:
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.google_api_key,
        )

    async def get_embeddings(self, text: str) -> list[float]:
        """Return a float vector for the given text using the configured provider."""
        return await self._embeddings.aembed_query(text)


# Module-level singleton — import this everywhere instead of instantiating
ai_service = AIService()
