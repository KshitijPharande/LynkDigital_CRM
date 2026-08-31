"use client";

import React, { useState, useEffect } from "react";
import { X, CalendarDays, ExternalLink, Building2 } from "lucide-react";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  calendarToEdit?: any | null;
  defaultClientId?: string;
}

export function CalendarModal({
  isOpen,
  onClose,
  onSuccess,
  calendarToEdit,
  defaultClientId,
}: CalendarModalProps) {
  const [clientId, setClientId] = useState(defaultClientId || "");
  const [month, setMonth] = useState("September 2026");
  const [year, setYear] = useState(2026);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [approvalStatus, setApprovalStatus] = useState("PENDING");
  const [nextDeadline, setNextDeadline] = useState("");

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => (res.ok ? res.json() : { clients: [] }))
      .then((data) => setClients(data.clients || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (calendarToEdit) {
      setClientId(calendarToEdit.clientId || "");
      setMonth(calendarToEdit.month || "September 2026");
      setYear(calendarToEdit.year || 2026);
      setGoogleSheetUrl(calendarToEdit.googleSheetUrl || "");
      setStatus(calendarToEdit.status || "IN_PROGRESS");
      setApprovalStatus(calendarToEdit.approvalStatus || "PENDING");
      setNextDeadline(
        calendarToEdit.nextDeadline
          ? new Date(calendarToEdit.nextDeadline).toISOString().split("T")[0]
          : ""
      );
    } else {
      setClientId(defaultClientId || "");
      setMonth("September 2026");
      setYear(2026);
      setGoogleSheetUrl("");
      setStatus("IN_PROGRESS");
      setApprovalStatus("PENDING");
      setNextDeadline("");
    }
  }, [calendarToEdit, defaultClientId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      clientId,
      month,
      year: Number(year),
      googleSheetUrl,
      status,
      approvalStatus,
      nextDeadline: nextDeadline || null,
    };

    try {
      const url = calendarToEdit
        ? `/api/calendars/${calendarToEdit.id}`
        : "/api/calendars";
      const method = calendarToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save calendar");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-lg w-full p-6 shadow-glass relative">
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {calendarToEdit ? "Edit Content Calendar" : "Link Content Calendar"}
              </h3>
              <p className="text-xs text-dark-muted">
                Connect a Google Sheet monthly content calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Select Client *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              disabled={!!defaultClientId && !calendarToEdit}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Choose Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brandName} ({c.industry})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Month *
              </label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="e.g. September 2026"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Google Sheet Content Calendar URL *
            </label>
            <input
              type="url"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              required
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Calendar Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Next Content Deadline
              </label>
              <input
                type="date"
                value={nextDeadline}
                onChange={(e) => setNextDeadline(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-dark-muted hover:text-white hover:bg-dark-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glowEmerald transition-all disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : calendarToEdit
                ? "Update Calendar"
                : "Save Calendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
