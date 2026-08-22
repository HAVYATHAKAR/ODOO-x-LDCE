import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthLayout } from "@/layouts/AuthLayout";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/context/AuthContext";
import type { ApiError } from "@/api/types";

const schema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError((err as ApiError).detail || "Login failed");
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to keep planning your adventures."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-semibold text-ocean-deep hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <Input
          label="Username or email"
          icon="person"
          autoComplete="username"
          placeholder="jane or jane@example.com"
          error={errors.identifier?.message}
          {...register("identifier")}
        />
        <Input
          label="Password"
          icon="lock"
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="text-outline hover:text-ocean-deep"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              <Icon name={showPw ? "visibility_off" : "visibility"} size={20} />
            </button>
          }
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-body-sm font-semibold text-ocean-deep hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
