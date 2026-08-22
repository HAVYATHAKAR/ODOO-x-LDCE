import { useNavigate } from "react-router-dom";

import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo />
      <p className="mt-10 font-display-lg text-7xl font-bold text-ocean-deep">404</p>
      <h1 className="mt-4 font-headline-md text-headline-md text-on-surface">Page not found</h1>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="outline" icon="arrow_back" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button icon="home" onClick={() => navigate("/")}>
          Home
        </Button>
      </div>
    </div>
  );
}
