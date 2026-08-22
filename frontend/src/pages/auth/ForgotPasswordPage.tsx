import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthLayout } from "@/layouts/AuthLayout";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { authApi } from "@/api/endpoints/auth";
import type { ApiError, ForgotPasswordResponse } from "@/api/types";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      setResult(await authApi.forgotPassword(values.email));
    } catch (err) {
      setFormError((err as ApiError).detail || "Something went wrong");
    }
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-semibold text-ocean-deep hover:underline">
          Back to log in
        </Link>
      }
    >
      {result ? (
        <div className="space-y-5">
          <Alert tone="success" title="Check your inbox">
            {result.detail}
          </Alert>
          {/* Dev convenience: backend returns the token directly in development. */}
          {result.reset_token && (
            <Alert tone="info" title="Development mode">
              <p>Use this link to set a new password:</p>
              <Link
                to={`/reset-password?token=${encodeURIComponent(result.reset_token)}`}
                className="mt-1 inline-block break-all font-semibold underline"
              >
                Continue to reset →
              </Link>
            </Alert>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert tone="danger">{formError}</Alert>}
          <Input
            label="Email"
            icon="mail"
            type="email"
            placeholder="jane@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
