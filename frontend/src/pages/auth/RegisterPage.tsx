import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const schema = z
  .object({
    first_name: z.string().trim().max(50).optional(),
    last_name: z.string().trim().max(50).optional(),
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(30, "At most 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscore only"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerUser({
        username: values.username,
        email: values.email,
        password: values.password,
        first_name: values.first_name || null,
        last_name: values.last_name || null,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError((err as ApiError).detail || "Registration failed");
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start planning smarter trips in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-ocean-deep hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {formError && <Alert tone="danger">{formError}</Alert>}
        <div className="grid grid-cols-2 gap-4">
          <Input label="First name" placeholder="Jane" error={errors.first_name?.message} {...register("first_name")} />
          <Input label="Last name" placeholder="Doe" error={errors.last_name?.message} {...register("last_name")} />
        </div>
        <Input
          label="Username"
          icon="alternate_email"
          placeholder="janedoe"
          autoComplete="username"
          error={errors.username?.message}
          {...register("username")}
        />
        <Input
          label="Email"
          icon="mail"
          type="email"
          placeholder="jane@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          icon="lock"
          type={showPw ? "text" : "password"}
          placeholder="At least 8 characters"
          autoComplete="new-password"
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
        <Input
          label="Confirm password"
          icon="lock"
          type={showPw ? "text" : "password"}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
