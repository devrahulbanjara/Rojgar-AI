import json
from typing import Any, Type, TypeVar

from groq import AsyncGroq
from pydantic import BaseModel

from app.core.config import settings


SchemaT = TypeVar("SchemaT", bound=BaseModel)


class GroqStructuredClient:
    def __init__(self) -> None:
        self.client = AsyncGroq(api_key=settings.groq_api_key)
        self.model = settings.groq_model_job_drafting

    async def generate_strict_json(
        self,
        system_prompt: str,
        user_payload: dict[str, Any],
        schema_model: Type[SchemaT],
    ) -> SchemaT:
        schema = schema_model.model_json_schema()

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"{system_prompt.strip()}\n\n"
                        "Output requirements:\n"
                        "- Return exactly one JSON object matching the schema.\n"
                        "- Do not wrap the result in another object.\n"
                        "- Do not echo the input payload.\n"
                        "- Do not include prose, markdown, or explanations."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(user_payload, ensure_ascii=False),
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": schema_model.__name__,
                    "strict": True,
                    "schema": schema,
                },
            },
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        return schema_model.model_validate(data)


groq_structured_client = GroqStructuredClient()
