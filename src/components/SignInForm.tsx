"use client";

import { useState } from "react";
import { Mail, ChefHat } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setErrorMsg(null);
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-1 py-8">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber text-white">
          <ChefHat size={24} />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Welcome to Galley
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          Sign in to sync your plan, recipes, and pantry across devices.
        </p>
      </div>

      {status === "sent" ? (
        <div className="card p-5 text-center">
          <Mail size={20} className="mx-auto text-moss" />
          <p className="mt-2 font-display text-lg font-semibold text-ink">
            Check your email
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            We sent a sign-in link to{" "}
            <span className="text-ink">{email}</span>. Open it on this device to
            finish signing in.
          </p>
          <button
            className="btn-quiet mt-4 w-full text-sm"
            onClick={() => {
              setStatus("idle");
              setEmail("");
            }}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-3 p-5">
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "sending"}
            />
          </div>
          <button
            type="submit"
            className="btn-amber w-full"
            disabled={status === "sending" || !email}
          >
            {status === "sending" ? "Sending link…" : "Send sign-in link"}
          </button>
          {status === "error" && (
            <p className="text-sm text-coral-ink">{errorMsg}</p>
          )}
          <p className="pt-1 text-center text-xs text-ink-faint">
            No password. We&apos;ll email you a one-tap sign-in link.
          </p>
        </form>
      )}
    </div>
  );
}
