import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Logo } from "@/components/Logo";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Footer link row under the card. */
  footer?: ReactNode;
}

/** Split-screen bare shell for login / register / password screens. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel (lg+) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ocean-deep p-12 lg:flex">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=60')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative text-white">
          <h2 className="font-display-lg text-4xl font-bold leading-tight">
            Plan your next adventure with confidence.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Build multi-city itineraries, track your budget, and share trips with fellow travelers —
            all in one place.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display-lg text-3xl font-bold text-ocean-deep">{title}</h1>
          {subtitle && <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-body-sm text-on-surface-variant">{footer}</div>}
        </div>
        <p className="mt-10 text-center text-caption text-on-surface-variant">
          <Link to="/" className="hover:text-ocean-deep">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
