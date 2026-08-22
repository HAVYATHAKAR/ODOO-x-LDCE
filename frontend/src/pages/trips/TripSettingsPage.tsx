import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Select } from "@/components/Select";
import { Toggle } from "@/components/Toggle";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { PageSpinner } from "@/components/Spinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { CURRENCIES } from "@/lib/currencies";
import type { ApiError } from "@/api/types";

const schema = z
  .object({
    name: z.string().trim().min(1, "Give your trip a name").max(120),
    description: z.string().trim().max(2000).optional(),
    start_date: z.string().min(1, "Pick a start date"),
    end_date: z.string().min(1, "Pick an end date"),
    cover_photo_url: z.string().trim().url("Enter a valid URL").or(z.literal("")).optional(),
    total_budget: z
      .string()
      .optional()
      .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Enter a valid amount"),
    currency: z.string().min(1),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: "End date must be on or after the start date",
    path: ["end_date"],
  });
type FormValues = z.infer<typeof schema>;

export function TripSettingsPage() {
  const { id } = useParams();
  const tripId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [isPublic, setIsPublic] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: trip, isLoading, error } = useQuery({
    queryKey: qk.trip(tripId),
    queryFn: () => tripsApi.get(tripId),
    enabled: Number.isFinite(tripId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!trip) return;
    reset({
      name: trip.name,
      description: trip.description ?? "",
      start_date: trip.start_date,
      end_date: trip.end_date,
      cover_photo_url: trip.cover_photo_url ?? "",
      total_budget: trip.total_budget ?? "",
      currency: trip.currency,
    });
    setIsPublic(trip.is_public);
    setShowBudget(trip.show_public_budget);
  }, [trip, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      tripsApi.update(tripId, {
        name: values.name,
        description: values.description || null,
        start_date: values.start_date,
        end_date: values.end_date,
        cover_photo_url: values.cover_photo_url || null,
        total_budget: values.total_budget ? values.total_budget : null,
        currency: values.currency,
        is_public: isPublic,
        show_public_budget: showBudget,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trip(tripId) });
      queryClient.invalidateQueries({ queryKey: qk.trips() });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Trip updated");
      navigate(`/trips/${tripId}`);
    },
    onError: (err) => setFormError((err as ApiError).detail || "Could not save changes"),
  });

  const remove = useMutation({
    mutationFn: () => tripsApi.remove(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trips() });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Trip deleted");
      navigate("/trips");
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not delete trip"),
  });

  if (isLoading) return <PageSpinner label="Loading…" />;
  if (error || !trip) {
    return (
      <Container size="narrow">
        <Alert tone="danger">{(error as ApiError)?.detail || "Trip not found"}</Alert>
      </Container>
    );
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    save.mutate(values);
  });

  return (
    <Container size="narrow">
      <Link
        to={`/trips/${tripId}`}
        className="inline-flex items-center gap-1 text-body-sm font-semibold text-ocean-deep hover:underline"
      >
        <Icon name="arrow_back" size={18} /> Back to trip
      </Link>
      <PageHeader className="mt-3" title="Trip settings" subtitle={trip.name} />

      <Card className="mt-6 p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert tone="danger">{formError}</Alert>}

          <Input label="Trip name" icon="edit" error={errors.name?.message} {...register("name")} />
          <Textarea label="Description" error={errors.description?.message} {...register("description")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start date" type="date" error={errors.start_date?.message} {...register("start_date")} />
            <Input label="End date" type="date" error={errors.end_date?.message} {...register("end_date")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Total budget"
              icon="payments"
              type="number"
              min={0}
              step="0.01"
              error={errors.total_budget?.message}
              {...register("total_budget")}
            />
            <Select label="Currency" error={errors.currency?.message} {...register("currency")}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </div>

          <Input label="Cover photo URL" icon="image" error={errors.cover_photo_url?.message} {...register("cover_photo_url")} />

          <div className="space-y-4 rounded-xl border border-surface-variant p-4">
            <Toggle label="Public sharing" description="Anyone with the link can view this trip" checked={isPublic} onChange={setIsPublic} />
            {isPublic && (
              <Toggle
                label="Show budget publicly"
                description="Include budget figures in the shared view"
                checked={showBudget}
                onChange={setShowBudget}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(`/trips/${tripId}`)}>
              Cancel
            </Button>
            <Button type="submit" icon="check" loading={save.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="mt-6 border-error/30 p-6">
        <h3 className="font-headline-md text-lg font-bold text-error">Danger zone</h3>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Deleting a trip removes its itinerary, activities, and budget permanently.
        </p>
        <Button className="mt-4" variant="danger" icon="delete" onClick={() => setConfirmDelete(true)}>
          Delete trip
        </Button>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this trip?"
        message={`"${trip.name}" and everything in it will be permanently deleted.`}
        confirmLabel="Delete trip"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </Container>
  );
}
