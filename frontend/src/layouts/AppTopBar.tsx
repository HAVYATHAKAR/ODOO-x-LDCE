import { Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";

/** Mobile-only top bar for the authenticated shell (sidebar is hidden on mobile). */
export function AppTopBar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-variant bg-surface-container-lowest/90 px-4 backdrop-blur md:hidden">
      <Logo />
      <Link to="/profile" aria-label="Profile">
        <Avatar user={user} size={36} />
      </Link>
    </header>
  );
}
