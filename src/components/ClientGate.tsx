"use client";

import { useEffect, useState } from "react";

// Persisted state lives in localStorage, which only exists on the client.
// Gate content until after mount so server and first client render agree.
export function ClientGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <div className="space-y-3 pt-2" aria-hidden>
        <div className="h-7 w-40 animate-pulse rounded-lg bg-surface-sunk" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface-sunk" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface-sunk" />
      </div>
    );
  }
  return <>{children}</>;
}
