import { NavLink, useNavigate } from "react-router-dom";

import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { fullName } from "@/lib/format";
import { APP_NAV, ADMIN_NAV, type NavItem } from "./nav-items";

function NavRow({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-4 py-3 text-body-md font-semibold transition-colors",
          isActive
            ? "bg-ocean-deep text-on-primary shadow-[0_4px_14px_rgba(0,51,102,0.25)]"
            : "text-on-surface-variant hover:bg-surface-container-low hover:text-ocean-deep",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} fill={isActive} size={22} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

/** Fixed left sidebar for authenticated app screens (md+ only). */
export function SideNavBar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-surface-variant bg-surface-container-lowest md:flex">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {APP_NAV.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
        {isAdmin && <NavRow item={ADMIN_NAV} />}
      </nav>

      <div className="border-t border-surface-variant p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <Avatar user={user} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-semibold text-on-surface">
              {user ? fullName(user) : ""}
            </p>
            <p className="truncate text-caption text-on-surface-variant">@{user?.username}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-body-sm font-semibold text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
        >
          <Icon name="logout" size={20} />
          Log out
        </button>
      </div>
    </aside>
  );
}
