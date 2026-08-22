import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tripsApi } from "@/api/endpoints/trips";
import { qk } from "@/lib/queryClient";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Toggle } from "@/components/Toggle";
import { Icon } from "@/components/Icon";
import type { ApiError, TripDetail } from "@/api/types";

export function ShareModal({
  open,
  onClose,
  trip,
}: {
  open: boolean;
  onClose: () => void;
  trip: TripDetail;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = trip.public_slug
    ? `${window.location.origin}/trips/shared/${trip.public_slug}`
    : null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.trip(trip.id) });

  const toggleShare = useMutation({
    mutationFn: (next: boolean) => (next ? tripsApi.share(trip.id) : tripsApi.unshare(trip.id)),
    onSuccess: (_data, next) => {
      invalidate();
      toast.success(next ? "Trip is now public" : "Sharing turned off");
    },
    onError: (err) => toast.error((err as ApiError).detail || "Could not update sharing"),
  });

  const toggleBudget = useMutation({
    mutationFn: (next: boolean) => tripsApi.update(trip.id, { show_public_budget: next }),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error((err as ApiError).detail || "Could not update"),
  });

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share trip" description="Let anyone view this itinerary with a link.">
      <div className="space-y-5">
        <div className="rounded-xl border border-surface-variant p-4">
          <Toggle
            label="Public sharing"
            description="Anyone with the link can view this trip"
            checked={trip.is_public}
            disabled={toggleShare.isPending}
            onChange={(v) => toggleShare.mutate(v)}
          />
        </div>

        {trip.is_public && (
          <>
            <div className="rounded-xl border border-surface-variant p-4">
              <Toggle
                label="Show budget publicly"
                description="Include budget figures in the shared view"
                checked={trip.show_public_budget}
                disabled={toggleBudget.isPending}
                onChange={(v) => toggleBudget.mutate(v)}
              />
            </div>

            {shareUrl && (
              <div>
                <label className="font-label-sm text-label-sm text-on-surface">Share link</label>
                <div className="mt-1.5 flex gap-2">
                  <div className="flex flex-1 items-center gap-2 truncate rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
                    <Icon name="link" size={18} />
                    <span className="truncate">{shareUrl}</span>
                  </div>
                  <Button variant={copied ? "outline" : "primary"} icon={copied ? "check" : "content_copy"} onClick={copy}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-ocean-deep hover:underline"
                >
                  Open public view <Icon name="open_in_new" size={16} />
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
