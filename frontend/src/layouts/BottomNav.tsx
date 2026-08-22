import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { BOTTOM_NAV } from "./nav-items";

/** Mobile-only bottom tab bar. Hidden on md+ where the side/top nav takes over. */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-variant bg-surface-container-lowest/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-ocean-deep" : "text-on-surface-variant",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} fill={isActive} size={24} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
