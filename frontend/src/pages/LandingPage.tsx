import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { citiesApi } from "@/api/endpoints/catalog";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { CityCard } from "@/components/CityCard";
import { SkeletonCard } from "@/components/Skeleton";

const FEATURES = [
  { icon: "map", title: "Multi-city itineraries", body: "Chain destinations, order your stops, and see the whole journey at a glance." },
  { icon: "payments", title: "Budget tracking", body: "Plan spend by category, log actuals, and stay on target with live insights." },
  { icon: "insights", title: "Smart insights", body: "Catch scheduling gaps and overspending before you travel — auto-fix with one tap." },
  { icon: "share", title: "Share & remix", body: "Publish trips with a link and copy others' itineraries as your own starting point." },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: qk.cities({ landing: true }),
    queryFn: () => citiesApi.search({ size: 8 }),
  });

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : "/explore");
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=70')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 hero-gradient" />
        <Container className="relative !py-24 sm:!py-32">
          <div className="max-w-2xl">
            <h1 className="font-display-lg text-4xl font-bold leading-tight text-white sm:text-5xl">
              Plan trips you'll actually take.
            </h1>
            <p className="mt-4 text-lg text-white/90">
              Build multi-city itineraries, track your budget, and share your adventures — all in one
              beautifully simple planner.
            </p>

            <form onSubmit={search} className="mt-8 flex max-w-lg gap-2 rounded-full bg-white p-2 shadow-lg">
              <span className="flex items-center pl-3 text-outline">
                <Icon name="search" size={22} />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Where do you want to go?"
                className="flex-1 border-0 bg-transparent text-body-md focus:outline-none focus:ring-0"
              />
              <Button type="submit" size="md">Search</Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? "/trips/new" : "/register"}>
                <Button size="lg" icon="add">{isAuthenticated ? "Plan a trip" : "Get started free"}</Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" variant="white" icon="travel_explore">Explore destinations</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <Container className="!py-16">
        <div className="text-center">
          <h2 className="font-display-lg text-3xl font-bold text-ocean-deep">Everything you need to plan</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">From first idea to final day, GlobeTrotter has you covered.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,51,102,0.08)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-tint text-ocean-deep">
                <Icon name={f.icon} size={26} />
              </span>
              <h3 className="mt-4 font-headline-md text-lg font-bold text-ocean-deep">{f.title}</h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">{f.body}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Popular destinations */}
      <div className="bg-surface-container-low/60">
        <Container className="!py-16">
          <div className="flex items-center justify-between">
            <h2 className="font-display-lg text-3xl font-bold text-ocean-deep">Popular destinations</h2>
            <Link to="/explore" className="text-body-sm font-semibold text-ocean-deep hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : data?.items.slice(0, 8).map((c) => <CityCard key={c.id} city={c} />)}
          </div>
        </Container>
      </div>

      {/* CTA */}
      <Container className="!py-20">
        <div className="rounded-3xl bg-ocean-deep px-8 py-14 text-center">
          <h2 className="font-display-lg text-3xl font-bold text-white">Ready for your next adventure?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Join GlobeTrotter and turn your travel dreams into a plan you can share.
          </p>
          <Link to={isAuthenticated ? "/dashboard" : "/register"} className="mt-8 inline-block">
            <Button size="lg" icon="rocket_launch">{isAuthenticated ? "Go to dashboard" : "Create your free account"}</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
