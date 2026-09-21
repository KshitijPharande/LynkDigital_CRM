"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-[54px] h-[28px] rounded-full bg-dark-card border border-dark-border animate-pulse shrink-0 ${className}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle Dark/Light Mode"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      className={`relative inline-flex h-[28px] w-[54px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-brand-500/50 ${
        isDark ? "bg-[#111827] border border-[#1F2937]" : "bg-[#EDEAE5] border border-[#D0D2DE]"
      } ${className}`}
    >
      <span className="sr-only">Toggle theme</span>

      {/* Track Icons */}
      <span className="absolute left-1.5 flex items-center justify-center text-amber-500 pointer-events-none">
        <Sun className="h-3 w-3" />
      </span>
      <span className="absolute right-1.5 flex items-center justify-center text-[#8B8FA8] pointer-events-none">
        <Moon className="h-3 w-3" />
      </span>

      {/* Sliding Knob */}
      <span
        className={`inline-block h-[22px] w-[22px] transform rounded-full shadow transition-transform duration-300 ease-in-out flex items-center justify-center pointer-events-none ${
          isDark
            ? "translate-x-[27px] bg-brand-600 text-white"
            : "translate-x-[3px] bg-[#2D3561] text-white"
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 fill-current" />
        ) : (
          <Sun className="h-3 w-3 fill-current" />
        )}
      </span>
    </button>
  );
}
