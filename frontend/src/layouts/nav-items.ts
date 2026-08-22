export interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** Only show to admins. */
  adminOnly?: boolean;
  /** Match the route even for nested paths. */
  end?: boolean;
}

// Primary navigation for authenticated app screens (side + bottom nav).
export const APP_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/trips", label: "My Trips", icon: "luggage" },
  { to: "/explore", label: "Explore", icon: "travel_explore" },
  { to: "/community", label: "Community", icon: "groups" },
  { to: "/profile", label: "Profile", icon: "person" },
];

export const ADMIN_NAV: NavItem = {
  to: "/admin",
  label: "Admin",
  icon: "admin_panel_settings",
  adminOnly: true,
};

// Condensed set for the mobile bottom bar (max 5 for thumb reach).
export const BOTTOM_NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: "home", end: true },
  { to: "/trips", label: "Trips", icon: "luggage" },
  { to: "/explore", label: "Explore", icon: "travel_explore" },
  { to: "/community", label: "Community", icon: "groups" },
  { to: "/profile", label: "Profile", icon: "person" },
];

// Public marketing nav (top bar).
export const PUBLIC_NAV: NavItem[] = [
  { to: "/explore", label: "Explore", icon: "travel_explore" },
  { to: "/community", label: "Community", icon: "groups" },
];
