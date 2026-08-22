import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sectionsApi } from "@/api/endpoints/sections";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Select } from "@/components/Select";
import { Alert } from "@/components/Alert";
import { CityPicker } from "./pickers";
import { SECTION_META } from "./section-meta";
import { SECTION_TYPES } from "@/api/types";
import type { ApiError, CitySummary, SectionType, TripSectionOut } from "@/api/types";

interface Props {
  open: boolean;
  onClose: () => void;
  tripId: number;
  tripStart: string;
  tripEnd: string;
  section: TripSectionOut | null;
}

export function SectionFormModal({ open, onClose, tripId, tripStart, tripEnd, section }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const editing = !!section;

  const [title, setTitle] = useState("");
  const [type, setType] = useState<SectionType>("activity");
  const [city, setCity] = useState<CitySummary | null>(null);
  const [start, setStart] = useState(tripStart);
  const [end, setEnd] = useState(tripStart);
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // (Re)initialise whenever the modal opens or the target section changes.
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (section) {
      setTitle(section.title);
      setType(section.section_type);
      setCity(section.city);
      setStart(section.start_date);
      setEnd(section.end_date);
      setBudget(section.budget && Number(section.budget) > 0 ? section.budget : "");
      setDescription(section.description ?? "");
    } else {
      setTitle("");
      setType("activity");
      setCity(null);
      setStart(tripStart);
      setEnd(tripStart);
      setBudget("");
      setDescription("");
    }
  }, [open, section, tripStart]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.trip(tripId) });
    queryClient.invalidateQueries({ queryKey: qk.tripBudget(tripId) });
    queryClient.invalidateQueries({ queryKey: qk.tripHealth(tripId) });
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: title.trim(),
        section_type: type,
        city_id: city?.id ?? null,
        start_date: start,
        end_date: end,
        budget: budget ? budget : "0",
        description: description.trim() || null,
      };
      return editing
        ? sectionsApi.update(tripId, section!.id, body)
        : sectionsApi.create(tripId, body);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? "Section updated" : "Section added");
      onClose();
    },
    onError: (err) => setError((err as ApiError).detail || "Could not save section"),
  });

  const submit = () => {
    setError(null);
    if (!title.trim()) return setError("Give this section a title");
    if (end < start) return setError("End date must be on or after the start date");
    save.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit section" : "Add a section"}
      description="Group your plans by stop, day, or theme."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" loading={save.isPending} onClick={submit}>
            {editing ? "Save" : "Add section"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input
          label="Title"
          placeholder="e.g. Days in Kyoto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value as SectionType)}>
          {SECTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {SECTION_META[t].label}
            </option>
          ))}
        </Select>
        <CityPicker value={city} onChange={setCity} label="City (optional)" />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start date"
            type="date"
            min={tripStart}
            max={tripEnd}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            min={tripStart}
            max={tripEnd}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <Input
          label="Budget (optional)"
          type="number"
          min={0}
          step="0.01"
          icon="payments"
          placeholder="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
        <Textarea
          label="Notes (optional)"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </Modal>
  );
}
