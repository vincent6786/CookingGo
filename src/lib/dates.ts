// All dates are handled as local yyyy-mm-dd strings to avoid timezone drift.

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

// Monday-start week containing the given date.
export function weekStart(iso: string): string {
  const d = fromISO(iso);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return toISO(d);
}

export function weekDates(startISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startISO, i));
}

export function dayLabel(iso: string): string {
  return fromISO(iso).toLocaleDateString(undefined, { weekday: "short" });
}

export function dayNumber(iso: string): string {
  return String(fromISO(iso).getDate());
}

export function monthDayLabel(iso: string): string {
  return fromISO(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isToday(iso: string): boolean {
  return iso === todayISO();
}

export function daysUntil(iso: string): number {
  const a = fromISO(todayISO()).getTime();
  const b = fromISO(iso).getTime();
  return Math.round((b - a) / 86400000);
}
