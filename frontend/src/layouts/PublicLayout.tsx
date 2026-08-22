import { Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { TopNavBar } from "./TopNavBar";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

/** Marketing / browsable shell: top nav + footer, bottom nav for signed-in users. */
export function PublicLayout() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNavBar />
      <main className={isAuthenticated ? "flex-1 pb-20 md:pb-0" : "flex-1"}>
        <Outlet />
      </main>
      <Footer />
      {isAuthenticated && <BottomNav />}
    </div>
  );
}
