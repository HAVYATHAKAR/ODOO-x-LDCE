"""Domain exceptions mapped to HTTP responses by a handler in ``app.main``.

Keeping these framework-light lets the service/CRUD layers signal problems
without importing FastAPI or knowing about HTTP.
"""
from __future__ import annotations


class AppError(Exception):
    """Base application error carrying an HTTP status and a safe detail message."""

    status_code: int = 400
    code: str = "app_error"

    def __init__(self, detail: str, *, code: str | None = None):
        super().__init__(detail)
        self.detail = detail
        if code:
            self.code = code


class BadRequestError(AppError):
    status_code = 400
    code = "bad_request"


class AuthError(AppError):
    status_code = 401
    code = "unauthorized"


class PermissionDeniedError(AppError):
    status_code = 403
    code = "forbidden"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"
