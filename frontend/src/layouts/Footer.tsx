import { Link } from "react-router-dom";

import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-surface-variant bg-surface-container-lowest">
      <div className="mx-auto max-w-container-max px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo />
          <nav className="flex flex-wrap items-center justify-center gap-6 text-body-sm text-on-surface-variant">
            <Link to="/explore" className="hover:text-ocean-deep">Explore</Link>
            <Link to="/community" className="hover:text-ocean-deep">Community</Link>
            <Link to="/login" className="hover:text-ocean-deep">Log in</Link>
            <Link to="/register" className="hover:text-ocean-deep">Sign up</Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-caption text-on-surface-variant">
          © {"2025"} GlobeTrotter. Plan trips, together.
        </p>
      </div>
    </footer>
  );
}
