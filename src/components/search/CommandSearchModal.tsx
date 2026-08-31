"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  CalendarDays,
  Users,
  X,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandSearchModal({ isOpen, onClose }: CommandSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load searchable data
      fetch("/api/clients")
        .then((res) => (res.ok ? res.json() : { clients: [] }))
        .then((data) => setClients(data.clients || []))
        .catch((e) => console.error(e));

      fetch("/api/calendars")
        .then((res) => (res.ok ? res.json() : { calendars: [] }))
        .then((data) => setCalendars(data.calendars || []))
        .catch((e) => console.error(e));

      fetch("/api/team")
        .then((res) => (res.ok ? res.json() : { users: [] }))
        .then((data) => setTeam(data.users || []))
        .catch((e) => console.error(e));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingClients = q
    ? clients.filter(
        (c) =>
          c.brandName.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q)
      )
    : clients.slice(0, 3);

  const matchingCalendars = q
    ? calendars.filter(
        (c) =>
          c.client.brandName.toLowerCase().includes(q) ||
          c.month.toLowerCase().includes(q)
      )
    : calendars.slice(0, 3);

  const matchingTeam = q
    ? team.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.designation.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
      )
    : team.slice(0, 3);

  const handleSelect = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-xl w-full shadow-glass overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-dark-border flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, content calendars, team directory..."
            className="w-full bg-transparent text-sm text-white placeholder-dark-subtle focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-dark-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {/* Clients Section */}
          {matchingClients.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-dark-subtle block mb-1.5 px-2">
                Clients & Accounts
              </span>
              <div className="space-y-1">
                {matchingClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleSelect(`/clients/${client.id}`)}
                    className="p-2.5 rounded-xl bg-dark-bg/60 hover:bg-dark-border/50 border border-dark-border/50 hover:border-brand-500/40 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-brand-400" />
                      <div>
                        <span className="font-semibold text-white">
                          {client.brandName}
                        </span>
                        <span className="text-dark-muted ml-2 text-[11px]">
                          {client.industry}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-dark-subtle" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Calendars Section */}
          {matchingCalendars.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-dark-subtle block mb-1.5 px-2">
                Google Sheet Content Calendars
              </span>
              <div className="space-y-1">
                {matchingCalendars.map((cal) => (
                  <div
                    key={cal.id}
                    className="p-2.5 rounded-xl bg-dark-bg/60 hover:bg-dark-border/50 border border-dark-border/50 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-semibold text-white">
                          {cal.client.brandName}
                        </span>
                        <span className="text-dark-muted ml-2 text-[11px]">
                          {cal.month} {cal.year} ({cal.status})
                        </span>
                      </div>
                    </div>
                    <a
                      href={cal.googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Open Sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members Section */}
          {matchingTeam.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-dark-subtle block mb-1.5 px-2">
                Team Directory
              </span>
              <div className="space-y-1">
                {matchingTeam.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleSelect("/team")}
                    className="p-2.5 rounded-xl bg-dark-bg/60 hover:bg-dark-border/50 border border-dark-border/50 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-violet-400" />
                      <div>
                        <span className="font-semibold text-white">
                          {member.name}
                        </span>
                        <span className="text-dark-muted ml-2 text-[11px]">
                          {member.designation} • {member.department}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-dark-subtle" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-dark-bg/80 border-t border-dark-border flex items-center justify-between text-[11px] text-dark-subtle px-4">
          <span>Press ESC to close</span>
          <span>LynkDigital Unified Command Search</span>
        </div>
      </div>
    </div>
  );
}
