"""Shared schema primitives used across the API."""
from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ORMModel(BaseModel):
    """Base for response models read directly from SQLAlchemy instances."""

    model_config = ConfigDict(from_attributes=True)


class Message(BaseModel):
    """Simple ``{"detail": "..."}`` response for actions without a body."""

    detail: str


class Page(BaseModel, Generic[T]):
    """A paginated envelope: items plus enough metadata to render controls."""

    items: list[T]
    total: int
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)

    @property
    def pages(self) -> int:
        if self.page_size == 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size
