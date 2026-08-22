import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { sectionsApi } from "@/api/endpoints/sections";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SortableSection } from "./SortableSection";
import { SectionFormModal } from "./SectionFormModal";
import { ActivityFormModal } from "./ActivityFormModal";
import type { ApiError, SectionActivityOut, TripDetail, TripSectionOut } from "@/api/types";

interface DeleteState {
  kind: "section" | "activity";
  section: TripSectionOut;
  item?: SectionActivityOut;
}

export function ItineraryPanel({ trip, editable }: { trip: TripDetail; editable: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [sections, setSections] = useState(trip.sections);
  const [sectionModal, setSectionModal] = useState<{ open: boolean; section: TripSectionOut | null }>({
    open: false,
    section: null,
  });
  const [activityModal, setActivityModal] = useState<{
    open: boolean;
    section: TripSectionOut | null;
    item: SectionActivityOut | null;
  }>({ open: false, section: null, item: null });
  const [toDelete, setToDelete] = useState<DeleteState | null>(null);

  useEffect(() => setSections(trip.sections), [trip.sections]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.trip(trip.id) });
    queryClient.invalidateQueries({ queryKey: qk.tripBudget(trip.id) });
    queryClient.invalidateQueries({ queryKey: qk.tripHealth(trip.id) });
  };

  const reorder = useMutation({
    mutationFn: (orderedIds: number[]) => sectionsApi.reorder(trip.id, orderedIds),
    onError: () => {
      setSections(trip.sections);
      invalidate();
      toast.error("Couldn't reorder sections");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (d: DeleteState) =>
      d.kind === "section"
        ? sectionsApi.remove(trip.id, d.section.id)
        : sectionsApi.removeActivity(trip.id, d.section.id, d.item!.id),
    onSuccess: () => {
      invalidate();
      toast.success("Deleted");
      setToDelete(null);
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not delete"),
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sections, oldIndex, newIndex);
    setSections(next);
    reorder.mutate(next.map((s) => s.id));
  };

  if (sections.length === 0) {
    return (
      <>
        <EmptyState
          icon="map"
          title="Your itinerary is empty"
          description={
            editable
              ? "Add sections for each stop, day, or theme — then fill them with activities."
              : "This trip doesn't have any sections yet."
          }
          action={
            editable ? (
              <Button icon="add" onClick={() => setSectionModal({ open: true, section: null })}>
                Add first section
              </Button>
            ) : undefined
          }
        />
        <SectionFormModal
          open={sectionModal.open}
          onClose={() => setSectionModal({ open: false, section: null })}
          tripId={trip.id}
          tripStart={trip.start_date}
          tripEnd={trip.end_date}
          section={sectionModal.section}
        />
      </>
    );
  }

  return (
    <div>
      {editable && (
        <div className="mb-4 flex justify-end">
          <Button icon="add" onClick={() => setSectionModal({ open: true, section: null })}>
            Add section
          </Button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                tripId={trip.id}
                currency={trip.currency}
                editable={editable}
                onEdit={() => setSectionModal({ open: true, section })}
                onDelete={() => setToDelete({ kind: "section", section })}
                onAddActivity={() => setActivityModal({ open: true, section, item: null })}
                onEditActivity={(item) => setActivityModal({ open: true, section, item })}
                onDeleteActivity={(item) => setToDelete({ kind: "activity", section, item })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Modals */}
      <SectionFormModal
        open={sectionModal.open}
        onClose={() => setSectionModal({ open: false, section: null })}
        tripId={trip.id}
        tripStart={trip.start_date}
        tripEnd={trip.end_date}
        section={sectionModal.section}
      />
      {activityModal.section && (
        <ActivityFormModal
          open={activityModal.open}
          onClose={() => setActivityModal({ open: false, section: null, item: null })}
          tripId={trip.id}
          section={activityModal.section}
          currency={trip.currency}
          item={activityModal.item}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title={toDelete?.kind === "section" ? "Delete section?" : "Delete activity?"}
        message={
          toDelete?.kind === "section"
            ? "This will remove the section and all activities inside it. This can't be undone."
            : "This activity will be removed from your itinerary."
        }
        confirmLabel="Delete"
        danger
        loading={deleteMut.isPending}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
