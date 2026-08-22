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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { sectionsApi } from "@/api/endpoints/sections";
import { qk } from "@/lib/queryClient";
import { cn } from "@/lib/cn";
import { fmtDate, fmtDateRange, formatMoney } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { sectionMeta } from "./section-meta";
import type { SectionActivityOut, TripSectionOut } from "@/api/types";

interface Props {
  section: TripSectionOut;
  tripId: number;
  currency: string;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddActivity: () => void;
  onEditActivity: (item: SectionActivityOut) => void;
  onDeleteActivity: (item: SectionActivityOut) => void;
}

export function SortableSection({
  section,
  tripId,
  currency,
  editable,
  onEdit,
  onDelete,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}: Props) {
  const meta = sectionMeta(section.section_type);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: !editable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,51,102,0.08)]",
        isDragging && "opacity-80 shadow-[0_12px_40px_rgba(0,51,102,0.2)]",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-surface-variant p-4">
        {editable && (
          <button
            type="button"
            className="mt-1 cursor-grab touch-none text-outline hover:text-ocean-deep active:cursor-grabbing"
            aria-label="Drag to reorder section"
            {...attributes}
            {...listeners}
          >
            <Icon name="drag_indicator" size={22} />
          </button>
        )}
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.chip)}>
          <Icon name={meta.icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-headline-md text-lg font-bold text-ocean-deep">{section.title}</h3>
            <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
              {meta.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-on-surface-variant">
            {section.city && (
              <span className="flex items-center gap-1">
                <Icon name="location_on" size={14} />
                {section.city.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="calendar_month" size={14} />
              {fmtDateRange(section.start_date, section.end_date)}
            </span>
            {Number(section.budget) > 0 && (
              <span className="flex items-center gap-1 font-semibold text-ocean-deep">
                <Icon name="payments" size={14} />
                {formatMoney(section.budget, currency)}
              </span>
            )}
          </div>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Edit section"
            >
              <Icon name="edit" size={20} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full p-2 text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
              aria-label="Delete section"
            >
              <Icon name="delete" size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Activities */}
      <ActivityList
        section={section}
        tripId={tripId}
        currency={currency}
        editable={editable}
        onEditActivity={onEditActivity}
        onDeleteActivity={onDeleteActivity}
      />

      {editable && (
        <div className="px-4 pb-4">
          <Button variant="outline" size="sm" icon="add" pill={false} fullWidth onClick={onAddActivity}>
            Add activity
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Nested sortable list of activities ───────────────────────
function ActivityList({
  section,
  tripId,
  currency,
  editable,
  onEditActivity,
  onDeleteActivity,
}: {
  section: TripSectionOut;
  tripId: number;
  currency: string;
  editable: boolean;
  onEditActivity: (item: SectionActivityOut) => void;
  onDeleteActivity: (item: SectionActivityOut) => void;
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(section.activities);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => setItems(section.activities), [section.activities]);

  const reorder = useMutation({
    mutationFn: (orderedIds: number[]) =>
      sectionsApi.reorderActivities(tripId, section.id, orderedIds),
    onError: () => {
      setItems(section.activities); // resync on failure
      queryClient.invalidateQueries({ queryKey: qk.trip(tripId) });
    },
  });

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorder.mutate(next.map((i) => i.id));
  };

  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-body-sm text-on-surface-variant">
        No activities yet.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-surface-variant">
          {items.map((item) => (
            <SortableActivity
              key={item.id}
              item={item}
              currency={currency}
              editable={editable}
              onEdit={() => onEditActivity(item)}
              onDelete={() => onDeleteActivity(item)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableActivity({
  item,
  currency,
  editable,
  onEdit,
  onDelete,
}: {
  item: SectionActivityOut;
  currency: string;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editable,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-3 px-4 py-3", isDragging && "bg-surface-container-low")}
    >
      {editable && (
        <button
          type="button"
          className="cursor-grab touch-none text-outline hover:text-ocean-deep active:cursor-grabbing"
          aria-label="Drag to reorder activity"
          {...attributes}
          {...listeners}
        >
          <Icon name="drag_indicator" size={18} />
        </button>
      )}
      <div className="w-14 shrink-0 text-caption font-semibold text-ocean-deep">
        {item.scheduled_time ? item.scheduled_time.slice(0, 5) : fmtDate(item.scheduled_date, "MMM d")}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-md font-medium text-on-surface">{item.display_name}</p>
        {item.notes && <p className="truncate text-caption text-on-surface-variant">{item.notes}</p>}
      </div>
      {Number(item.expense) > 0 && (
        <span className="shrink-0 text-body-sm font-semibold text-on-surface-variant">
          {formatMoney(item.expense, currency)}
        </span>
      )}
      {editable && (
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Edit activity"
          >
            <Icon name="edit" size={18} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
            aria-label="Delete activity"
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      )}
    </li>
  );
}
