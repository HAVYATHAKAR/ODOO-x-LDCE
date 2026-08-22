"""FastAPI application entrypoint.

Wires CORS, domain-exception handling, the API router, and (for the zero-setup
SQLite path) creates tables on startup. Under PostgreSQL, Alembic owns the
schema and this bootstrap is skipped.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app import models  # noqa: F401  (populate metadata for create_all)
from app.api.routers import api_router
from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import AppError


@asynccontextmanager
async def lifespan(app: FastAPI):
    # SQLite dev/test: create the schema directly. Postgres uses Alembic.
    if settings.is_sqlite:
        models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="GlobeTrotter — multi-city travel planning API.",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )


@app.exception_handler(IntegrityError)
async def handle_integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "detail": "This operation conflicts with existing data "
            "(a duplicate, or a record still referenced elsewhere).",
            "code": "integrity_error",
        },
    )


@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "name": settings.PROJECT_NAME,
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX,
    }


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
