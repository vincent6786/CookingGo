"use client";

import { useEffect, useState } from "react";
import { RotateCcw, AlertTriangle, Sun, Moon, Monitor } from "lucide-react";
import { useStore } from "@/lib/store";
import { ClientGate } from "@/components/ClientGate";
import { PageHeader, Stepper } from "@/components/ui";
import clsx from "clsx";

const WEEKDAYS = [
  { i: 1, label: "Mon" },
  { i: 2, label: "Tue" },
  { i: 3, label: "Wed" },
  { i: 4, label: "Thu" },
  { i: 5, label: "Fri" },
  { i: 6, label: "Sat" },
  { i: 0, label: "Sun" },
];

export default function SettingsPage() {
  return (
    <ClientGate>
      <SettingsScreen />
    </ClientGate>
  );
}

function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);

  function toggleCookDay(i: number) {
    const has = settings.preferredCookDays.includes(i);
    updateSettings({
      preferredCookDays: has
        ? settings.preferredCookDays.filter((d) => d !== i)
        : [...settings.preferredCookDays, i].sort((a, b) => a - b),
    });
  }

  return (
    <div className="pb-6">
      <PageHeader eyebrow="Setup" title="Settings" />

      <div className="space-y-5">
        {/* Profile */}
        <Section title="You">
          <div>
            <label className="field-label">Name</label>
            <input
              className="field"
              value={settings.name}
              placeholder="What should the app call you?"
              onChange={(e) => updateSettings({ name: e.target.value })}
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Used for the greeting on your Today screen.
            </p>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface-raised p-1">
            {(
              [
                { value: "light", label: "Light", Icon: Sun },
                { value: "system", label: "System", Icon: Monitor },
                { value: "dark", label: "Dark", Icon: Moon },
              ] as const
            ).map(({ value, label, Icon }) => {
              const active = (settings.theme ?? "system") === value;
              return (
                <button
                  key={value}
                  onClick={() => updateSettings({ theme: value })}
                  className={clsx(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-amber text-white shadow-sm"
                      : "text-ink-soft hover:bg-surface-sunk"
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Units */}
        <Section title="Measurements">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-raised p-1">
            {(["us", "metric"] as const).map((u) => (
              <button
                key={u}
                onClick={() => updateSettings({ units: u })}
                className={clsx(
                  "rounded-lg py-2 text-sm font-semibold capitalize transition-colors",
                  settings.units === u
                    ? "bg-amber text-white shadow-sm"
                    : "text-ink-soft hover:bg-surface-sunk"
                )}
              >
                {u === "us" ? "US / Imperial" : "Metric"}
              </button>
            ))}
          </div>
        </Section>

        {/* Cooking rhythm */}
        <Section title="Cooking rhythm">
          <Row
            label="Weeknight time budget"
            hint="Recipes longer than this are flagged when you plan on a weekday."
          >
            <div className="flex items-center gap-2">
              <Stepper
                value={settings.weekdayMaxCookMinutes}
                min={10}
                max={120}
                onChange={(n) => updateSettings({ weekdayMaxCookMinutes: n })}
              />
              <span className="text-sm text-ink-faint">min</span>
            </div>
          </Row>

          <Row
            label="Default portions"
            hint="Pre-fills how many servings you plate for a meal."
          >
            <Stepper
              value={settings.defaultPortions}
              min={1}
              max={12}
              onChange={(n) => updateSettings({ defaultPortions: n })}
            />
          </Row>

          <div className="pt-1">
            <p className="text-sm font-medium text-ink-soft">Batch-cook days</p>
            <p className="mb-2 text-xs text-ink-faint">
              Days you prefer to do bigger cooks for leftovers.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map(({ i, label }) => {
                const on = settings.preferredCookDays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleCookDay(i)}
                    className={clsx(
                      "h-10 w-12 rounded-xl border text-sm font-semibold transition-colors",
                      on
                        ? "border-moss bg-moss text-white"
                        : "border-line bg-surface-raised text-ink-soft hover:bg-surface-sunk"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Planning preferences">
          <Toggle
            label="I'm happy eating leftovers"
            hint="Lets the planner suggest leftover days after a batch cook."
            checked={settings.acceptsLeftovers}
            onChange={(v) => updateSettings({ acceptsLeftovers: v })}
          />
          <Toggle
            label="Subtract pantry from shopping"
            hint="Removes staples you already have from the grocery list."
            checked={settings.subtractPantry}
            onChange={(v) => updateSettings({ subtractPantry: v })}
          />
        </Section>

        {/* Data */}
        <Section title="Data">
          <p className="text-xs text-ink-faint">
            Everything lives on this device, in this browser. Nothing is sent to a
            server. Add the app to your Home Screen to keep it one tap away.
          </p>

          <StorageUsage />

          {!confirmReset ? (
            <button
              className="btn-quiet mt-1 w-full !justify-start gap-2 text-coral"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={16} /> Reset all data
            </button>
          ) : (
            <div className="rounded-xl border border-coral bg-coral-soft p-3">
              <p className="flex items-start gap-2 text-sm font-medium text-coral-ink">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                This erases your recipes, plan, leftovers, and pantry, and restores
                the starter recipes. It can&apos;t be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-ghost flex-1"
                  onClick={() => setConfirmReset(false)}
                >
                  Keep my data
                </button>
                <button
                  className="flex-1 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white"
                  onClick={() => {
                    resetAll();
                    setConfirmReset(false);
                  }}
                >
                  Erase everything
                </button>
              </div>
            </div>
          )}
        </Section>

        <p className="pt-2 text-center text-xs text-ink-faint">
          Galley · a local-first cooking routine
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="eyebrow mb-2 px-1">{title}</h2>
      <div className="card space-y-4 p-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function StorageUsage() {
  const [estimate, setEstimate] = useState<{
    usage?: number;
    quota?: number;
  } | null>(null);

  useEffect(() => {
    if (!navigator.storage?.estimate) return;
    navigator.storage.estimate().then((e) => setEstimate(e));
  }, []);

  if (!estimate) return null;

  const usedMB = (estimate.usage ?? 0) / (1024 * 1024);
  const quotaMB = estimate.quota ? estimate.quota / (1024 * 1024) : undefined;
  const pct =
    quotaMB && quotaMB > 0
      ? Math.min(100, Math.round((usedMB / quotaMB) * 100))
      : null;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink-soft">Storage used</p>
        <p className="readout text-xs text-ink-faint">
          {usedMB < 0.1 ? "<0.1" : usedMB.toFixed(1)} MB
          {quotaMB ? ` / ${formatQuota(quotaMB)}` : ""}
        </p>
      </div>
      {pct !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div
            className="h-full bg-moss"
            style={{ width: `${Math.max(2, pct)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function formatQuota(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 100) return `${Math.round(mb)} MB`;
  return `${mb.toFixed(1)} MB`;
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      </div>
      <input
        type="checkbox"
        className="h-5 w-5 shrink-0 accent-moss"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
