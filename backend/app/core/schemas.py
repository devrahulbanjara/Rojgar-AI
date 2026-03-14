from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base Pydantic schema with ORM mode enabled for all app schemas."""

    model_config = ConfigDict(from_attributes=True)
