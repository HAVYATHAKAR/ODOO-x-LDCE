// Register our normalized ApiError as the default error type for TanStack Query.
// client.ts rejects every request with an ApiError-shaped object (see normalizeError),
// so query/mutation `error` values are ApiError at runtime — this makes the types match.
import "@tanstack/react-query";
import type { ApiError } from "@/api/types";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}
