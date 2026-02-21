from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import settings


def get_embedding_model():
    return GoogleGenerativeAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        api_key=settings.GOOGLE_API_KEY,
        output_dimensionality=settings.EMBEDDING_DIM,
    )
