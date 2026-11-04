"use client";

import { useEffect, useState } from "react";

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  localStorage.setItem("craft-theme", theme);
}

export default function ThemeToggle({ light = false }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("craft-theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }
    setTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );
  }, []);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next);
        setTheme(next);
      }}
      className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${
        light
          ? "border-white/30 text-white hover:bg-white/10"
          : "border-[var(--line)] text-[var(--ink)] hover:bg-[var(--brand-soft)]"
      }`}
      aria-label={next === "dark" ? "Включить тёмную тему" : "Включить светлую тему"}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
