"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const LAST_ACTIVITY_KEY = "lynk_last_activity_timestamp";

export function InactivityGuard() {
  const router = useRouter();

  const handleLogoutDueToInactivity = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Auto-logout error:", e);
    } finally {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      router.push("/login?timeout=true");
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    // Record initial activity timestamp
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    let throttleTimer: NodeJS.Timeout | null = null;

    const recordActivity = () => {
      // Throttle activity writes to once every 2 seconds
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          throttleTimer = null;
        }, 2000);
      }
    };

    // User interaction events to monitor
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    // Check inactivity every 10 seconds
    const interval = setInterval(() => {
      const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        const now = Date.now();

        if (now - lastActivity >= INACTIVITY_TIMEOUT_MS) {
          clearInterval(interval);
          handleLogoutDueToInactivity();
        }
      }
    }, 10000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(interval);
    };
  }, [handleLogoutDueToInactivity]);

  return null;
}
