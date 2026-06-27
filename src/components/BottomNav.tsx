"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChefHat, Home, ListChecks, Refrigerator } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/plan", label: "Plan", icon: CalendarDays },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/shopping", label: "Shop", icon: ListChecks },
  { href: "/pantry", label: "Pantry", icon: Refrigerator },
];

export default function BottomNav() {
  const path = usePathname();

  // Cooking mode is fullscreen — hide the nav there.
  if (path?.includes("/cook")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised/95 shadow-nav backdrop-blur">
      <div
        className="mx-auto flex max-w-2xl items-stretch justify-around lg:max-w-4xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? path === "/" : path?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-ink" : "text-ink-faint hover:text-ink-soft"
              )}
            >
              <span
                className={clsx(
                  "flex h-9 w-12 items-center justify-center rounded-xl transition-colors",
                  active && "bg-amber-soft text-amber-ink"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
