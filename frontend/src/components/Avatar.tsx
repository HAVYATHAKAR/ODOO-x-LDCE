import { cn } from "@/lib/cn";
import { fullName, initials } from "@/lib/format";
import type { UserPublic } from "@/api/types";

interface AvatarProps {
  user?: Pick<UserPublic, "first_name" | "last_name" | "username" | "avatar_url"> | null;
  name?: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ user, name, src, size = 40, className }: AvatarProps) {
  const displayName = name ?? (user ? fullName(user) : "?");
  const image = src ?? user?.avatar_url ?? null;
  const dims = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (image) {
    return (
      <img
        src={image}
        alt={displayName}
        style={dims}
        className={cn("rounded-full object-cover bg-surface-container-high", className)}
      />
    );
  }
  return (
    <span
      style={dims}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-ocean-deep font-semibold text-on-primary select-none",
        className,
      )}
    >
      {initials(displayName)}
    </span>
  );
}

interface AvatarStackProps {
  users: UserPublic[];
  max?: number;
  size?: number;
}

export function AvatarStack({ users, max = 4, size = 32 }: AvatarStackProps) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((u, i) => (
        <Avatar
          key={u.id}
          user={u}
          size={size}
          className={cn("ring-2 ring-surface-container-lowest", i > 0 && "-ml-2")}
        />
      ))}
      {extra > 0 && (
        <span
          style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
          className="-ml-2 inline-flex items-center justify-center rounded-full bg-surface-container-high font-semibold text-on-surface-variant ring-2 ring-surface-container-lowest"
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
