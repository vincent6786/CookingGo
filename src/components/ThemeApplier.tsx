"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export default function ThemeApplier() {
  const theme = useStore((s) => s.settings.theme) ?? "system";

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      if (isDark) root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
    };

    apply();
    if (theme === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [theme]);

  return null;
}
