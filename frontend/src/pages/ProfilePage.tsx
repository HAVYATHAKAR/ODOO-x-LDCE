import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

import { usersApi } from "@/api/endpoints/users";
import { authApi } from "@/api/endpoints/auth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { Avatar } from "@/components/Avatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { fmtDate, fullName } from "@/lib/format";
import type { ApiError } from "@/api/types";

const profileSchema = z.object({
  first_name: z.string().trim().max(50).optional(),
  last_name: z.string().trim().max(50).optional(),
  phone_number: z.string().trim().max(30).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  avatar_url: z.string().trim().url("Enter a valid URL").or(z.literal("")).optional(),
  additional_info: z.string().trim().max(1000).optional(),
  language_pref: z.string().min(1),
});
type ProfileValues = z.infer<typeof profileSchema>;

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
];

export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (!user) return;
    reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.phone_number ?? "",
      city: user.city ?? "",
      country: user.country ?? "",
      avatar_url: user.avatar_url ?? "",
      additional_info: user.additional_info ?? "",
      language_pref: user.language_pref || "en",
    });
  }, [user, reset]);

  const saveProfile = useMutation({
    mutationFn: (values: ProfileValues) =>
      usersApi.updateMe({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        phone_number: values.phone_number || null,
        city: values.city || null,
        country: values.country || null,
        avatar_url: values.avatar_url || null,
        additional_info: values.additional_info || null,
        language_pref: values.language_pref,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Profile updated");
    },
    onError: (err) => setProfileError((err as ApiError).detail || "Could not save profile"),
  });

  const deleteAccount = useMutation({
    mutationFn: () => usersApi.deleteMe(),
    onSuccess: () => {
      toast.success("Account deleted");
      logout();
      navigate("/");
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not delete account"),
  });

  if (!user) return null;

  const previewAvatar = watch("avatar_url") || user.avatar_url;

  return (
    <Container size="narrow">
      <PageHeader title="Profile & settings" subtitle="Manage your account and preferences." />

      {/* Identity card */}
      <Card className="mt-6 flex items-center gap-4 p-6">
        <Avatar user={{ ...user, avatar_url: previewAvatar ?? null }} size={72} />
        <div className="min-w-0">
          <h2 className="truncate font-headline-md text-xl font-bold text-ocean-deep">{fullName(user)}</h2>
          <p className="text-body-sm text-on-surface-variant">@{user.username} · {user.email}</p>
          <p className="text-caption text-on-surface-variant">Member since {fmtDate(user.created_at)}</p>
        </div>
      </Card>

      {/* Profile form */}
      <Card className="mt-6 p-6 sm:p-8">
        <h3 className="font-headline-md text-lg font-bold text-ocean-deep">Personal details</h3>
        <form onSubmit={handleSubmit((v) => { setProfileError(null); saveProfile.mutate(v); })} className="mt-5 space-y-5" noValidate>
          {profileError && <Alert tone="danger">{profileError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First name" error={errors.first_name?.message} {...register("first_name")} />
            <Input label="Last name" error={errors.last_name?.message} {...register("last_name")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" icon="call" error={errors.phone_number?.message} {...register("phone_number")} />
            <Select label="Language" {...register("language_pref")}>
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="City" icon="location_city" error={errors.city?.message} {...register("city")} />
            <Input label="Country" icon="public" error={errors.country?.message} {...register("country")} />
          </div>
          <Input label="Avatar URL" icon="image" error={errors.avatar_url?.message} {...register("avatar_url")} />
          <Textarea label="About you" rows={3} error={errors.additional_info?.message} {...register("additional_info")} />
          <div className="flex justify-end">
            <Button type="submit" icon="check" loading={saveProfile.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <PasswordCard />

      {/* Account actions */}
      <Card className="mt-6 p-6">
        <h3 className="font-headline-md text-lg font-bold text-on-surface">Account</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" icon="logout" onClick={() => { logout(); navigate("/"); }}>
            Log out
          </Button>
          <Button variant="danger" icon="delete_forever" onClick={() => setConfirmDelete(true)}>
            Delete account
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This permanently deletes your account and all your trips. This cannot be undone."
        confirmLabel="Delete account"
        danger
        loading={deleteAccount.isPending}
        onConfirm={() => deleteAccount.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </Container>
  );
}

// ── Change-password card ─────────────────────────────────────
const pwSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    new_password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });
type PwValues = z.infer<typeof pwSchema>;

function PasswordCard() {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PwValues>({ resolver: zodResolver(pwSchema) });

  const change = useMutation({
    mutationFn: (v: PwValues) => authApi.changePassword(v.current_password, v.new_password),
    onSuccess: () => {
      toast.success("Password changed");
      reset({ current_password: "", new_password: "", confirm: "" });
    },
    onError: (err) => setError((err as ApiError).detail || "Could not change password"),
  });

  return (
    <Card className="mt-6 p-6 sm:p-8">
      <h3 className="font-headline-md text-lg font-bold text-ocean-deep">Change password</h3>
      <form onSubmit={handleSubmit((v) => { setError(null); change.mutate(v); })} className="mt-5 space-y-5" noValidate>
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label="Current password" type="password" icon="lock" autoComplete="current-password" error={errors.current_password?.message} {...register("current_password")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="New password" type="password" icon="lock_reset" autoComplete="new-password" error={errors.new_password?.message} {...register("new_password")} />
          <Input label="Confirm new password" type="password" icon="lock_reset" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" icon="key" loading={change.isPending}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
