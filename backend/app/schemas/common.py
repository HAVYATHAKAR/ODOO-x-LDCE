"""Shared schema primitives used across the API."""
from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, computed_field

T = TypeVar("T")


class ORMModel(BaseModel):
    """Base for response models read directly from SQLAlchemy instances."""

    model_config = ConfigDict(from_attributes=True)


class Message(BaseModel):
    """Simple ``{"detail": "..."}`` response for actions without a body."""

    detail: str


class Page(BaseModel, Generic[T]):
    """A paginated envelope: items plus enough metadata to render controls.

    Per the documented API contract (doc/REST_API_Specification.md) the
    client-facing page-size field is ``size`` and the envelope also reports the
    total number of ``pages``. Internally we keep the attribute name
    ``page_size`` (routers construct ``Page(page_size=...)``), exposing ``size``
    via the alias; ``populate_by_name`` keeps construction-by-name working.
    """

    model_config = ConfigDict(populate_by_name=True)

    items: list[T]
    total: int
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=200, alias="size")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def pages(self) -> int:
        if self.page_size <= 0:
            return 0
        return (self.total + self.page_size - 1) // self.page_size
