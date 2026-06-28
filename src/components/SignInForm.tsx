"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Phase = "email" | "code" | "verifying";

export default function SignInForm() {
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setErrorMsg(null);
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: {
        // Desktop users can still click the link in the email. PWA / iOS
        // users type the 6-digit code instead — both paths verify the
        // same OTP.
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setSending(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setPhase("code");
      setCode("");
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.trim();
    if (token.length < 6) {
      setErrorMsg("Enter the 6-digit code from your email.");
      return;
    }
    setPhase("verifying");
    setErrorMsg(null);
    const { error } = await supabase().auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      setErrorMsg(error.message);
      setPhase("code");
    }
    // On success, AuthGate's onAuthStateChange handles the rest.
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

      {phase === "email" ? (
        <form onSubmit={onSendCode} className="card space-y-3 p-5">
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
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            className="btn-amber w-full"
            disabled={sending || !email}
          >
            {sending ? "Sending code…" : "Send sign-in code"}
          </button>
          {errorMsg && <p className="text-sm text-coral-ink">{errorMsg}</p>}
          <p className="pt-1 text-center text-xs text-ink-faint">
            No password. We&apos;ll email you a 6-digit code.
          </p>
        </form>
      ) : (
        <form onSubmit={onVerifyCode} className="card space-y-3 p-5">
          <p className="text-sm text-ink-soft">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-ink">{email}</span>. Enter it
            below to finish signing in.
          </p>
          <div>
            <label htmlFor="code" className="field-label">
              Sign-in code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              className="field readout text-center text-xl tracking-[0.4em]"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={phase === "verifying"}
            />
          </div>
          <button
            type="submit"
            className="btn-amber w-full"
            disabled={phase === "verifying" || code.length < 6}
          >
            {phase === "verifying" ? "Verifying…" : "Verify and sign in"}
          </button>
          {errorMsg && <p className="text-sm text-coral-ink">{errorMsg}</p>}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              className="text-ink-faint underline-offset-2 hover:text-ink hover:underline"
              onClick={() => {
                setPhase("email");
                setCode("");
                setErrorMsg(null);
              }}
            >
              Use a different email
            </button>
            <button
              type="button"
              className="text-ink-faint underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
              disabled={sending}
              onClick={async () => {
                setSending(true);
                setErrorMsg(null);
                const { error } = await supabase().auth.signInWithOtp({
                  email,
                  options: {
                    emailRedirectTo:
                      typeof window !== "undefined"
                        ? window.location.origin
                        : undefined,
                  },
                });
                setSending(false);
                if (error) setErrorMsg(error.message);
              }}
            >
              {sending ? "Resending…" : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
