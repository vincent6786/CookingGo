"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { migrateLocalIfNeeded } from "@/lib/cloudStorage";
import { useStore } from "@/lib/store";
import SignInForm from "./SignInForm";
import BottomNav from "./BottomNav";

const MAIN_CLASS = "mx-auto w-full max-w-2xl px-4 pt-5 lg:max-w-4xl";

type Phase = "loading" | "signedOut" | "signedIn";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      // Misconfigured deploy — surface it loudly instead of hanging on a
      // skeleton forever.
      setPhase("signedOut");
      return;
    }

    const sb = supabase();
    let cancelled = false;

    async function bootstrap(session: Session | null) {
      if (cancelled) return;
      if (!session) {
        setPhase("signedOut");
        return;
      }
      try {
        await migrateLocalIfNeeded();
        await useStore.persist.rehydrate();
      } catch (err) {
        console.error("[AuthGate] hydration failed", err);
      }
      if (!cancelled) setPhase("signedIn");
    }

    sb.auth.getSession().then(({ data }) => bootstrap(data.session));

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setPhase("signedOut");
        return;
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        bootstrap(session);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (phase === "loading") {
    return (
      <main className={MAIN_CLASS}>
        <div className="space-y-3 pt-2" aria-hidden>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-surface-sunk" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-sunk" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-sunk" />
        </div>
      </main>
    );
  }

  if (phase === "signedOut") {
    return (
      <main className={MAIN_CLASS}>
        {hasSupabaseConfig() ? (
          <SignInForm />
        ) : (
          <div className="card mx-auto mt-10 max-w-md p-5">
            <h1 className="font-display text-lg font-bold text-ink">
              Setup needed
            </h1>
            <p className="mt-1 text-sm text-ink-faint">
              This deployment is missing its Supabase config. Add{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel project
              settings and redeploy.
            </p>
          </div>
        )}
      </main>
    );
  }

  return (
    <>
      <main className={MAIN_CLASS}>{children}</main>
      <BottomNav />
    </>
  );
}
