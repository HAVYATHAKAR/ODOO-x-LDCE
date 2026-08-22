import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { CURRENCIES } from "@/lib/currencies";
import type { ApiError, TripDetail } from "@/api/types";

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

export function NewTripPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "INR" },
  });

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      tripsApi.create({
        name: values.name,
        description: values.description || null,
        start_date: values.start_date,
        end_date: values.end_date,
        cover_photo_url: values.cover_photo_url || null,
        total_budget: values.total_budget ? values.total_budget : null,
        currency: values.currency,
      }),
    onSuccess: (trip: TripDetail) => {
      queryClient.invalidateQueries({ queryKey: qk.trips() });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Trip created — start building your itinerary!");
      navigate(`/trips/${trip.id}`);
    },
    onError: (err) => setFormError((err as ApiError).detail || "Could not create trip"),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    create.mutate(values);
  });

  return (
    <Container size="narrow">
      <PageHeader title="Plan a new trip" subtitle="Set the basics — you can refine everything later." />

      <Card className="mt-6 p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert tone="danger">{formError}</Alert>}

          <Input
            label="Trip name"
            icon="edit"
            placeholder="Summer in Southeast Asia"
            error={errors.name?.message}
            {...register("name")}
          />
          <Textarea
            label="Description"
            placeholder="What's this trip about?"
            hint="Optional"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              error={errors.start_date?.message}
              {...register("start_date")}
            />
            <Input
              label="End date"
              type="date"
              error={errors.end_date?.message}
              {...register("end_date")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Total budget"
              icon="payments"
              type="number"
              min={0}
              step="0.01"
              placeholder="50000"
              hint="Optional target"
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

          <Input
            label="Cover photo URL"
            icon="image"
            placeholder="https://…"
            hint="Optional — we'll use a default if left blank"
            error={errors.cover_photo_url?.message}
            {...register("cover_photo_url")}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" icon="check" loading={create.isPending}>
              Create trip
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
}
