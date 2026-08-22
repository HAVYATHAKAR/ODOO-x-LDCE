import type { SectionType } from "@/api/types";

interface SectionMeta {
  label: string;
  icon: string;
  /** Tailwind classes for the icon chip. */
  chip: string;
}

export const SECTION_META: Record<SectionType, SectionMeta> = {
  transport: { label: "Transport", icon: "flight", chip: "bg-sky-tint text-ocean-deep" },
  accommodation: { label: "Accommodation", icon: "hotel", chip: "bg-purple-100 text-purple-700" },
  activity: { label: "Activity", icon: "local_activity", chip: "bg-sunset-action/15 text-secondary" },
  food: { label: "Food", icon: "restaurant", chip: "bg-amber-100 text-amber-700" },
  sightseeing: { label: "Sightseeing", icon: "photo_camera", chip: "bg-green-100 text-green-700" },
  other: { label: "Other", icon: "category", chip: "bg-surface-container-high text-on-surface-variant" },
};

export function sectionMeta(type: SectionType): SectionMeta {
  return SECTION_META[type] ?? SECTION_META.other;
}
