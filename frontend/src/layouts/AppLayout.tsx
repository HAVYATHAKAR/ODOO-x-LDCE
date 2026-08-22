import { Outlet } from "react-router-dom";

import { SideNavBar } from "./SideNavBar";
import { BottomNav } from "./BottomNav";
import { AppTopBar } from "./AppTopBar";

interface AppLayoutProps {
  /** Admin screens reuse this shell without the mobile bottom nav. */
  noBottomNav?: boolean;
}

/** Authenticated app shell: fixed sidebar on md+, mobile top bar + bottom nav. */
export function AppLayout({ noBottomNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SideNavBar />
      <div className="md:ml-64">
        <AppTopBar />
        <main className={noBottomNav ? "min-h-screen" : "min-h-screen pb-20 md:pb-0"}>
          <Outlet />
        </main>
      </div>
      {!noBottomNav && <BottomNav />}
    </div>
  );
}
