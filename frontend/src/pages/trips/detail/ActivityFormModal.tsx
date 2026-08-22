import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sectionsApi } from "@/api/endpoints/sections";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Alert } from "@/components/Alert";
import { cn } from "@/lib/cn";
import { ActivityPicker } from "./pickers";
import type { ActivityOut, ApiError, SectionActivityOut, TripSectionOut } from "@/api/types";

interface Props {
  open: boolean;
  onClose: () => void;
  tripId: number;
  section: TripSectionOut;
  currency: string;
  item: SectionActivityOut | null;
}

type Mode = "catalog" | "custom";

export function ActivityFormModal({ open, onClose, tripId, section, currency, item }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const editing = !!item;

  const [mode, setMode] = useState<Mode>("catalog");
  const [activity, setActivity] = useState<ActivityOut | null>(null);
  const [customName, setCustomName] = useState("");
  const [date, setDate] = useState(section.start_date);
  const [time, setTime] = useState("");
  const [expense, setExpense] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (item) {
      setMode(item.activity ? "catalog" : "custom");
      setActivity(item.activity);
      setCustomName(item.custom_name ?? "");
      setDate(item.scheduled_date);
      setTime(item.scheduled_time ?? "");
      setExpense(item.expense && Number(item.expense) > 0 ? item.expense : "");
      setNotes(item.notes ?? "");
    } else {
      setMode("catalog");
      setActivity(null);
      setCustomName("");
      setDate(section.start_date);
      setTime("");
      setExpense("");
      setNotes("");
    }
  }, [open, item, section.start_date]);

  const pickActivity = (a: ActivityOut | null) => {
    setActivity(a);
    if (a && !expense) setExpense(a.estimated_cost);
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        activity_id: mode === "catalog" ? activity?.id ?? null : null,
        custom_name: mode === "custom" ? customName.trim() : null,
        scheduled_date: date,
        scheduled_time: time || null,
        expense: expense ? expense : "0",
        notes: notes.trim() || null,
      };
      return editing
        ? sectionsApi.updateActivity(tripId, section.id, item!.id, body)
        : sectionsApi.addActivity(tripId, section.id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.trip(tripId) });
      queryClient.invalidateQueries({ queryKey: qk.tripBudget(tripId) });
      queryClient.invalidateQueries({ queryKey: qk.tripHealth(tripId) });
      toast.success(editing ? "Activity updated" : "Activity added");
      onClose();
    },
    onError: (err) => setError((err as ApiError).detail || "Could not save activity"),
  });

  const submit = () => {
    setError(null);
    if (mode === "catalog" && !activity) return setError("Pick an activity or switch to custom");
    if (mode === "custom" && !customName.trim()) return setError("Enter a name for this activity");
    save.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit activity" : "Add activity"}
      description={section.title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" loading={save.isPending} onClick={submit}>
            {editing ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-1">
          {(["catalog", "custom"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg py-2 text-body-sm font-semibold transition-colors",
                mode === m ? "bg-surface-container-lowest text-ocean-deep shadow" : "text-on-surface-variant",
              )}
            >
              {m === "catalog" ? "From catalog" : "Custom"}
            </button>
          ))}
        </div>

        {mode === "catalog" ? (
          <div className="space-y-1.5">
            <span className="font-label-sm text-label-sm text-on-surface">Activity</span>
            <ActivityPicker
              cityId={section.city_id}
              value={activity}
              onChange={pickActivity}
              currency={currency}
            />
          </div>
        ) : (
          <Input
            label="Activity name"
            placeholder="e.g. Sunset kayak tour"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            min={section.start_date}
            max={section.end_date}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input label="Time (optional)" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <Input
          label="Expense"
          type="number"
          min={0}
          step="0.01"
          icon="payments"
          placeholder="0"
          value={expense}
          onChange={(e) => setExpense(e.target.value)}
        />
        <Textarea label="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}
