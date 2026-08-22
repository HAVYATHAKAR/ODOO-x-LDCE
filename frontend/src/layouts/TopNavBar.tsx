import { Link, NavLink, useNavigate } from "react-router-dom";

import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { PUBLIC_NAV } from "./nav-items";

export function TopNavBar() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-variant bg-surface-container-lowest/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-4 py-2 text-body-sm font-semibold transition-colors",
                    isActive
                      ? "bg-sky-tint text-ocean-deep"
                      : "text-on-surface-variant hover:bg-surface-container-low",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/dashboard" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-surface-container-low">
              <Avatar user={user} size={36} />
              <span className="hidden text-body-sm font-semibold text-on-surface sm:block">
                Dashboard
              </span>
            </Link>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
