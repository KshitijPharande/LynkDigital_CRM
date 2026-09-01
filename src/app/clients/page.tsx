"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Users,
  FolderKanban,
  FileText,
  Palette,
  CalendarDays,
  ArrowUpRight,
  Shield,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.clients) setClients(data.clients);

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);
    } catch (err) {
      console.error("Error loading clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const statuses = [
    { label: "All Statuses", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "On Hold", value: "ON_HOLD" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Dropped", value: "DROPPED" },
  ];

  const priorities = [
    { label: "All Priority", value: "ALL" },
    { label: "High Priority", value: "HIGH" },
    { label: "Medium", value: "MEDIUM" },
    { label: "Low", value: "LOW" },
  ];

  const filteredClients = clients.filter((client) => {
    const matchesStatus =
      selectedStatus === "ALL" || client.status === selectedStatus;
    const matchesPriority =
      selectedPriority === "ALL" || client.priority === selectedPriority;
    const matchesSearch =
      client.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <AppShell
      title="Client Management & Asset Directory"
      subtitle="Client roster, assigned creative teams, and quick access to Google Drive & Sheet calendars"
      currentUser={currentUser}
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-dark-subtle absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by brand, industry, contact..."
              className="w-full bg-dark-card border border-dark-border text-xs rounded-xl pl-9 pr-3 py-2 text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Filter Dropdowns & Add Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-dark-card p-1 rounded-xl border border-dark-border overflow-x-auto text-xs">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedStatus(s.value)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedStatus === s.value
                      ? "bg-brand-600 text-white shadow-glow"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-dark-card border border-dark-border text-xs rounded-xl px-3 py-1.5 text-gray-300 focus:outline-none focus:border-brand-500"
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Add Client Button */}
            {isAdmin && (
              <button
                onClick={() => {
                  setClientToEdit(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Client</span>
              </button>
            )}
          </div>
        </div>

        {/* Client Roster Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="glass-panel p-6 rounded-2xl border border-dark-border animate-pulse h-64"
              />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
            <Building2 className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No clients found</p>
            <p className="text-xs text-dark-muted mt-1">
              Try adjusting your search criteria or add a new client to the roster.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              const latestCalendar = client.contentCalendars?.[0];
              const teamMembers = client.teamAssignments || [];

              return (
                <div
                  key={client.id}
                  className="glass-panel glass-panel-hover p-5 rounded-2xl border border-dark-border flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Brand Name, Status, Priority */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-bold text-base text-white hover:text-brand-400 transition-colors flex items-center gap-1"
                          >
                            {client.brandName}
                            <ArrowUpRight className="w-4 h-4 opacity-60" />
                          </Link>
                        </div>
                        <p className="text-xs text-brand-400 font-medium">
                          {client.industry}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            client.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : client.status === "ON_HOLD"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          {client.status.replace(/_/g, " ")}
                        </span>
                        {client.priority === "HIGH" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                            HIGH
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact Person Details */}
                    {(client.contactPerson || client.contactEmail || client.contactPhone) ? (
                      <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border/80 text-xs space-y-1">
                        {client.contactPerson && (
                          <p className="text-gray-200 font-semibold">
                            {client.contactPerson}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-dark-muted text-[11px] gap-2">
                          {client.contactEmail ? (
                            <a
                              href={`mailto:${client.contactEmail}`}
                              className="hover:text-brand-300 transition-colors truncate"
                            >
                              {client.contactEmail}
                            </a>
                          ) : (
                            <span className="text-dark-subtle">No email</span>
                          )}
                          {client.contactPhone && (
                            <span className="shrink-0">{client.contactPhone}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-dark-bg/40 border border-dark-border/50 text-[11px] text-dark-subtle italic">
                        No contact person listed
                      </div>
                    )}

                    {/* Assigned Creative Team */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-dark-subtle mb-1.5">
                        Assigned Team ({teamMembers.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {client.accountManager && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                            Mgr: {client.accountManager.name}
                          </span>
                        )}
                        {teamMembers.slice(0, 3).map((tm: any) => (
                          <span
                            key={tm.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-dark-bg border border-dark-border text-gray-300"
                          >
                            {tm.user.name} ({tm.role.replace(/_/g, " ").toLowerCase()})
                          </span>
                        ))}
                        {teamMembers.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-dark-border text-dark-muted font-semibold">
                            +{teamMembers.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Google Workspace One-Click Hub */}
                    <div className="pt-2 border-t border-dark-border/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-dark-subtle mb-2">
                        Google Workspace Assets
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {latestCalendar?.googleSheetUrl ? (
                          <a
                            href={latestCalendar.googleSheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all"
                          >
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5" />
                              <span className="truncate">Content Sheet</span>
                            </div>
                            <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                          </a>
                        ) : (
                          <div className="p-2 rounded-xl bg-dark-bg/50 border border-dark-border text-dark-subtle text-xs flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>No Calendar</span>
                          </div>
                        )}

                        {client.googleDriveFolder ? (
                          <a
                            href={client.googleDriveFolder}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold flex items-center justify-between transition-all"
                          >
                            <div className="flex items-center gap-1.5">
                              <FolderKanban className="w-3.5 h-3.5" />
                              <span className="truncate">Drive Folder</span>
                            </div>
                            <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                          </a>
                        ) : (
                          <div className="p-2 rounded-xl bg-dark-bg/50 border border-dark-border text-dark-subtle text-xs flex items-center gap-1.5">
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>No Drive Link</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Detail Link & Edit */}
                  <div className="pt-4 mt-4 border-t border-dark-border/60 flex items-center justify-between">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <span>View Full Profile</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setClientToEdit(client);
                          setIsModalOpen(true);
                        }}
                        className="text-xs text-dark-muted hover:text-white px-2 py-1 rounded-lg hover:bg-dark-border transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClientToEdit(null);
        }}
        onSuccess={fetchClients}
        clientToEdit={clientToEdit}
      />
    </AppShell>
  );
}
