import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { tripsApi } from "@/api/endpoints/trips";
import { sectionsApi } from "@/api/endpoints/sections";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { sectionMeta } from "@/pages/trips/detail/section-meta";
import { formatMoney } from "@/lib/format";
import type { ActivityOut, ApiError } from "@/api/types";

/**
 * Adds a catalog activity to a chosen trip's itinerary section — a real
 * end-to-end write (trip → section → sectionsApi.addActivity).
 */
export function AddToTripModal({
  open,
  onClose,
  activity,
}: {
  open: boolean;
  onClose: () => void;
  activity: ActivityOut;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tripId, setTripId] = useState<number | "">("");
  const [sectionId, setSectionId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [done, setDone] = useState<number | null>(null);

  const tripsQuery = useQuery({
    queryKey: qk.trips({ picker: true }),
    queryFn: () => tripsApi.list({ size: 100 }),
    enabled: open,
  });

  const tripQuery = useQuery({
    queryKey: qk.trip(Number(tripId)),
    queryFn: () => tripsApi.get(Number(tripId)),
    enabled: open && typeof tripId === "number",
  });

  const sections = tripQuery.data?.sections ?? [];
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === sectionId),
    [sections, sectionId],
  );

  // Reset selections whenever the modal (re)opens for a new activity.
  useEffect(() => {
    if (open) {
      setTripId("");
      setSectionId("");
      setDate("");
      setDone(null);
    }
  }, [open, activity.id]);

  // Default the scheduled date to the chosen section's start date.
  useEffect(() => {
    if (selectedSection) setDate((d) => d || selectedSection.start_date);
  }, [selectedSection]);

  const add = useMutation({
    mutationFn: () =>
      sectionsApi.addActivity(Number(tripId), Number(sectionId), {
        activity_id: activity.id,
        scheduled_date: date || selectedSection!.start_date,
        expense: activity.estimated_cost ?? "0",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trip(Number(tripId)) });
      queryClient.invalidateQueries({ queryKey: qk.tripBudget(Number(tripId)) });
      queryClient.invalidateQueries({ queryKey: qk.tripHealth(Number(tripId)) });
      toast.success(`Added “${activity.name}” to your itinerary`);
      setDone(Number(tripId));
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not add to trip"),
  });

  const trips = tripsQuery.data?.items ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to a trip"
      description={activity.name}
      footer={
        done == null ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              icon="add"
              loading={add.isPending}
              disabled={typeof tripId !== "number" || typeof sectionId !== "number" || !date}
              onClick={() => add.mutate()}
            >
              Add activity
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Link to={`/trips/${done}`}>
              <Button icon="arrow_forward">Open trip</Button>
            </Link>
          </>
        )
      }
    >
      {tripsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon="luggage"
          title="No trips yet"
          description="Create a trip first, then add activities to its itinerary."
          action={
            <Link to="/trips/new">
              <Button icon="add">Create a trip</Button>
            </Link>
          }
        />
      ) : done != null ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Icon name="check" size={30} />
          </span>
          <p className="mt-3 font-headline-md text-lg font-bold text-ocean-deep">Added to your trip</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {activity.name} · {formatMoney(activity.estimated_cost)}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Select
            label="Trip"
            value={tripId}
            onChange={(e) => {
              setTripId(e.target.value ? Number(e.target.value) : "");
              setSectionId("");
              setDate("");
            }}
          >
            <option value="">Select a trip…</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>

          {typeof tripId === "number" && (
            <>
              {tripQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size={22} />
                </div>
              ) : sections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low/60 p-4 text-body-sm text-on-surface-variant">
                  This trip has no itinerary sections yet.{" "}
                  <Link to={`/trips/${tripId}`} className="font-semibold text-ocean-deep hover:underline">
                    Open the trip
                  </Link>{" "}
                  to add one first.
                </div>
              ) : (
                <>
                  <Select
                    label="Section"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Select a section…</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {sectionMeta(s.section_type).label} · {s.title}
                      </option>
                    ))}
                  </Select>

                  {selectedSection && (
                    <Input
                      label="Scheduled date"
                      type="date"
                      value={date}
                      min={selectedSection.start_date}
                      max={selectedSection.end_date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  )}
                </>
              )}
            </>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-surface-container-low/60 p-3 text-body-sm text-on-surface-variant">
            <Icon name="payments" size={18} className="text-sunset-action" />
            Estimated cost logged as expense: {formatMoney(activity.estimated_cost)}
          </div>
        </div>
      )}
    </Modal>
  );
}
