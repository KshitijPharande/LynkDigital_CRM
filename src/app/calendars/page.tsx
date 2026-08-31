"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarModal } from "@/components/calendars/CalendarModal";
import {
  CalendarDays,
  ExternalLink,
  Plus,
  Search,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function CalendarsPage() {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarToEdit, setCalendarToEdit] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendars");
      const data = await res.json();
      if (data.calendars) setCalendars(data.calendars);

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);
    } catch (err) {
      console.error("Error loading calendars:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  const handleUpdateStatus = async (calendarId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/calendars/${calendarId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchCalendars();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const statuses = [
    { label: "All Statuses", value: "ALL" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Approved", value: "APPROVED" },
    { label: "Not Started", value: "NOT_STARTED" },
    { label: "Completed", value: "COMPLETED" },
  ];

  const filteredCalendars = calendars.filter((cal) => {
    const matchesStatus =
      selectedStatus === "ALL" || cal.status === selectedStatus;
    const matchesSearch =
      cal.client.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cal.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cal.client.industry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const inProgressCount = calendars.filter((c) => c.status === "IN_PROGRESS").length;
  const approvedCount = calendars.filter((c) => c.status === "APPROVED").length;
  const completedCount = calendars.filter((c) => c.status === "COMPLETED").length;

  return (
    <AppShell
      title="Content Calendars Directory"
      subtitle="Centralized directory for accessing client Google Sheets content calendars & tracking deadlines"
      currentUser={currentUser}
    >
      <div className="space-y-6">
        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <span className="text-xs font-medium text-dark-muted">In Progress</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-blue-400">{inProgressCount}</span>
              <span className="text-xs text-dark-subtle">Calendars being drafted</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <span className="text-xs font-medium text-dark-muted">Client Approved</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">{approvedCount}</span>
              <span className="text-xs text-dark-subtle">Ready for scheduling</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <span className="text-xs font-medium text-dark-muted">Completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-purple-400">{completedCount}</span>
              <span className="text-xs text-dark-subtle">Fully published months</span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-dark-subtle absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name or month..."
              className="w-full bg-dark-card border border-dark-border text-xs rounded-xl pl-9 pr-3 py-2 text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-dark-card p-1 rounded-xl border border-dark-border overflow-x-auto text-xs">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedStatus(s.value)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedStatus === s.value
                      ? "bg-emerald-600 text-white shadow-glowEmerald"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setCalendarToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glowEmerald transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Calendar</span>
            </button>
          </div>
        </div>

        {/* Content Calendars Table */}
        {loading ? (
          <div className="glass-panel rounded-2xl border border-dark-border p-8 animate-pulse h-64" />
        ) : filteredCalendars.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
            <CalendarDays className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No content calendars found</p>
            <p className="text-xs text-dark-muted mt-1">
              Link a new Google Sheet calendar to start tracking deadlines.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-bg/80 border-b border-dark-border text-dark-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Client / Account</th>
                    <th className="px-4 py-3.5 font-semibold">Month & Period</th>
                    <th className="px-4 py-3.5 font-semibold">Calendar Status</th>
                    <th className="px-4 py-3.5 font-semibold">Next Content Deadline</th>
                    <th className="px-4 py-3.5 font-semibold">Last Updated</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Google Sheet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/60">
                  {filteredCalendars.map((cal) => (
                    <tr
                      key={cal.id}
                      className="hover:bg-dark-border/30 transition-colors"
                    >
                      {/* Client */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/clients/${cal.client.id}`}
                          className="font-semibold text-white hover:text-brand-400 transition-colors flex items-center gap-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-brand-400" />
                          <span>{cal.client.brandName}</span>
                        </Link>
                        <p className="text-[11px] text-dark-muted">
                          {cal.client.industry}
                        </p>
                      </td>

                      {/* Month */}
                      <td className="px-4 py-4 font-medium text-gray-200">
                        {cal.month} {cal.year}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-4">
                        <select
                          value={cal.status}
                          onChange={(e) =>
                            handleUpdateStatus(cal.id, e.target.value)
                          }
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium border focus:outline-none cursor-pointer ${
                            cal.status === "APPROVED" || cal.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : cal.status === "IN_PROGRESS"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/30"
                          }`}
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="APPROVED">Approved</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>

                      {/* Next Content Deadline */}
                      <td className="px-4 py-4">
                        {cal.nextDeadline ? (
                          <div className="flex items-center gap-1.5 text-gray-200 font-medium">
                            <Clock className="w-3.5 h-3.5 text-dark-subtle" />
                            <span>{formatDate(cal.nextDeadline)}</span>
                          </div>
                        ) : (
                          <span className="text-dark-subtle italic">Not set</span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-4 text-dark-muted text-[11px]">
                        {formatDate(cal.lastUpdatedDate)}
                      </td>

                      {/* Action: Open in Google Sheets */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setCalendarToEdit(cal);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-border transition-colors text-[11px]"
                          >
                            Edit
                          </button>

                          <a
                            href={cal.googleSheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Open Sheet</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCalendarToEdit(null);
        }}
        onSuccess={fetchCalendars}
        calendarToEdit={calendarToEdit}
      />
    </AppShell>
  );
}
