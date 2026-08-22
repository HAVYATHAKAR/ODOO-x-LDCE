import { cn } from "@/lib/cn";

interface IconProps {
  name: string;
  /** Render the filled glyph variant. */
  fill?: boolean;
  className?: string;
  /** Font size in px (maps to the optical-size axis too). */
  size?: number;
  title?: string;
}

/** Material Symbols Outlined glyph. */
export function Icon({ name, fill, className, size, title }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined select-none", fill && "fill", className)}
      style={size ? { fontSize: size } : undefined}
      aria-hidden={title ? undefined : true}
      title={title}
      role={title ? "img" : undefined}
    >
      {name}
    </span>
  );
}
