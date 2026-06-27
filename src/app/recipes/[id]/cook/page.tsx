"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Check,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { Stepper } from "@/components/ui";
import { scaleQuantity, fmtQty, fmtUnit } from "@/lib/units";
import { todayISO, addDays } from "@/lib/dates";
import clsx from "clsx";

export default function CookPage() {
  return (
    <ClientGate>
      <Suspense fallback={null}>
        <Cook />
      </Suspense>
    </ClientGate>
  );
}

function Cook() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const id = params.id as string;

  const recipe = useStore((s) => s.recipes.find((r) => r.id === id));
  const markCooked = useStore((s) => s.markCooked);
  const addLeftover = useStore((s) => s.addLeftover);

  const initialServings = Number(search.get("servings")) || recipe?.servings || 2;
  const [servings] = useState(initialServings);
  const [step, setStep] = useState(0); // 0 = mise en place, 1..N steps, N+1 = finish
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  // keep screen awake while cooking
  useWakeLock();

  const ingredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      ...ing,
      scaled: scaleQuantity(ing.quantity, servings, recipe.servings),
    }));
  }, [recipe, servings]);

  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-ink-faint">Recipe not found.</p>
        <Link href="/recipes" className="btn-ghost">
          Back to recipes
        </Link>
      </div>
    );
  }

  const total = recipe.steps.length;
  const onMise = step === 0;
  const onFinish = step === total + 1;
  const stepIndex = step - 1; // into recipe.steps
  const progress = Math.min(step, total + 1) / (total + 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      {/* top bar */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link
          href={`/recipes/${id}`}
          className="btn-quiet !min-h-0 !p-2"
          aria-label="Exit cooking mode"
        >
          <X size={22} />
        </Link>
        <div className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunk">
            <div
              className="h-full rounded-full bg-amber transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <span className="readout text-sm text-ink-faint">
          {onMise ? "prep" : onFinish ? "done" : `${step}/${total}`}
        </span>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {onMise && (
          <div className="mx-auto max-w-lg">
            <p className="eyebrow mb-1">{recipe.name}</p>
            <h1 className="mb-5 font-display text-3xl font-bold text-ink">Gather everything</h1>
            <p className="mb-4 text-ink-faint">
              Tap each item as you measure it out for {servings} portions.
            </p>
            <ul className="space-y-2">
              {ingredients.map((ing) => {
                const on = checks[ing.id];
                return (
                  <li key={ing.id}>
                    <button
                      onClick={() => setChecks((c) => ({ ...c, [ing.id]: !c[ing.id] }))}
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                        on
                          ? "border-moss bg-moss-soft"
                          : "border-line bg-surface-raised"
                      )}
                    >
                      <span
                        className={clsx(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                          on ? "border-moss bg-moss text-white" : "border-line"
                        )}
                      >
                        {on && <Check size={15} />}
                      </span>
                      <span className={clsx("flex-1", on && "text-ink-faint line-through")}>
                        {ing.name}
                        {ing.note && <span className="text-ink-faint"> · {ing.note}</span>}
                      </span>
                      <span className="readout font-medium text-ink">
                        {fmtQty(ing.scaled)} {fmtUnit(ing.unit, ing.scaled)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!onMise && !onFinish && (
          <div className="mx-auto flex h-full max-w-lg flex-col">
            <p className="eyebrow mb-3">Step {step} of {total}</p>
            <p className="font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
              {recipe.steps[stepIndex]}
            </p>
            <div className="mt-8">
              <Timer />
            </div>
          </div>
        )}

        {onFinish && (
          <FinishPanel
            recipe={recipe}
            servings={servings}
            onSave={(portions, location) => {
              markCooked(recipe.id);
              if (portions > 0) {
                addLeftover({
                  recipeId: recipe.id,
                  portions,
                  cookedDate: todayISO(),
                  location,
                  consumeByDate: addDays(todayISO(), recipe.storageDays),
                });
              }
              router.push("/");
            }}
            onSkip={() => {
              markCooked(recipe.id);
              router.push("/");
            }}
          />
        )}
      </div>

      {/* nav */}
      {!onFinish && (
        <div
          className="flex items-center gap-3 border-t border-line bg-surface-raised px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            className="btn-ghost flex-1 disabled:opacity-30"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft size={18} /> Back
          </button>
          <button className="btn-amber flex-[2]" onClick={() => setStep((s) => s + 1)}>
            {onMise ? "Start cooking" : step === total ? "Finish" : "Next step"}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function FinishPanel({
  recipe,
  servings,
  onSave,
  onSkip,
}: {
  recipe: { name: string; emoji: string; storageDays: number; freezerFriendly: boolean };
  servings: number;
  onSave: (portions: number, location: string) => void;
  onSkip: () => void;
}) {
  const [portions, setPortions] = useState(0);
  const [location, setLocation] = useState(recipe.freezerFriendly ? "Fridge" : "Fridge");

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-3 text-6xl">{recipe.emoji}</div>
      <h1 className="font-display text-3xl font-bold text-ink">Nicely done.</h1>
      <p className="mt-1 text-ink-faint">
        Any portions left over? Log them so they don&apos;t get forgotten.
      </p>

      <div className="card mt-6 space-y-4 p-5 text-left">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Leftover portions</span>
          <Stepper value={portions} onChange={setPortions} min={0} max={20} />
        </div>
        {portions > 0 && (
          <>
            <div>
              <label className="field-label">Store in</label>
              <div className="flex gap-2">
                {["Fridge", "Freezer"].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={clsx(
                      "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                      location === loc
                        ? "border-ink bg-ink text-surface"
                        : "border-line bg-surface-raised text-ink-faint"
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
            <p className="readout text-xs text-ink-faint">
              Suggested consume-by: {recipe.storageDays} days from today.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <button className="btn-ghost flex-1" onClick={onSkip}>
          No leftovers
        </button>
        <button
          className="btn-amber flex-[2]"
          onClick={() => onSave(portions, location)}
        >
          <Check size={18} /> {portions > 0 ? "Save leftovers" : "Finish"}
        </button>
      </div>
    </div>
  );
}

function Timer() {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false);
            try {
              navigator.vibrate?.([200, 100, 200]);
            } catch {}
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="rounded-2xl border border-line bg-surface-raised p-4">
      <div className="mb-3 flex items-center gap-2 text-ink-faint">
        <TimerIcon size={16} />
        <span className="eyebrow">Timer</span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            "readout text-4xl font-bold tabular-nums",
            remaining === 0 ? "text-ink-faint" : "text-ink"
          )}
        >
          {mm}:{ss}
        </span>
        <div className="flex gap-2">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunk text-ink hover:bg-line"
            aria-label={running ? "Pause" : "Start"}
            onClick={() => remaining > 0 && setRunning((r) => !r)}
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunk text-ink hover:bg-line"
            aria-label="Reset"
            onClick={() => {
              setRunning(false);
              setRemaining(0);
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 3, 5, 10, 15, 20].map((m) => (
          <button
            key={m}
            className="rounded-lg bg-surface-sunk px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-line"
            onClick={() => {
              setRemaining((r) => r + m * 60);
            }}
          >
            +{m}m
          </button>
        ))}
      </div>
    </div>
  );
}

function useWakeLock() {
  useEffect(() => {
    let lock: any = null;
    let released = false;
    const request = async () => {
      try {
        // @ts-ignore - wakeLock is not in all TS lib targets
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        /* not supported or denied; non-fatal */
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      try {
        lock?.release?.();
      } catch {}
    };
  }, []);
}
