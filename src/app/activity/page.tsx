"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  History,
  Building2,
  CalendarDays,
  CheckCircle2,
  PlaneTakeoff,
  Megaphone,
  UserCheck,
  Clock,
  Filter,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("ALL");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);

      const res = await fetch(`/api/activity?type=${selectedType}`);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error("Error loading activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [selectedType]);

  const entityFilters = [
    { label: "All Audit Events", value: "ALL" },
    { label: "Clients", value: "CLIENT" },
    { label: "Calendars", value: "CALENDAR" },
    { label: "Leaves", value: "LEAVE" },
    { label: "Announcements", value: "ANNOUNCEMENT" },
  ];

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "CLIENT":
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case "CALENDAR":
        return <CalendarDays className="w-4 h-4 text-emerald-400" />;
      case "LEAVE":
        return <PlaneTakeoff className="w-4 h-4 text-violet-400" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="w-4 h-4 text-rose-400" />;
      default:
        return <History className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <AppShell
      title="System Activity & Audit Log"
      subtitle="Chronological audit history of client operations, calendar updates, approvals, and decisions"
      currentUser={currentUser}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {entityFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedType(f.value)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedType === f.value
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-dark-card border border-dark-border text-dark-muted hover:text-white hover:border-dark-borderLight"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Activity Timeline List */}
        {loading ? (
          <div className="glass-panel p-8 rounded-2xl border border-dark-border animate-pulse h-64" />
        ) : logs.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
            <History className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No activity logs found</p>
            <p className="text-xs text-dark-muted mt-1">
              Events will be recorded here as agency actions take place.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-dark-border p-6 divide-y divide-dark-border/60">
            {logs.map((log) => (
              <div
                key={log.id}
                className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-dark-bg border border-dark-border mt-0.5 shrink-0">
                    {getEntityIcon(log.entityType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-gray-300">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      {log.user && (
                        <span className="text-xs text-brand-400 font-semibold">
                          {log.user.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-200 mt-1">
                      {log.details}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-dark-subtle whitespace-nowrap flex items-center gap-1 shrink-0 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
