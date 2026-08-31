"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  FileText,
  Palette,
  ExternalLink,
  Users,
  Mail,
  Phone,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}`);
      const data = await res.json();
      if (data.client) setClient(data.client);

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);
    } catch (err) {
      console.error("Error loading client:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const handleDeleteClient = async () => {
    if (!confirm(`Are you sure you want to delete ${client?.brandName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete client");
      router.push("/clients");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete client");
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";

  if (loading) {
    return (
      <AppShell title="Loading Client Profile..." currentUser={currentUser}>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-dark-card rounded-xl w-48" />
          <div className="h-64 bg-dark-card rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!client) {
    return (
      <AppShell title="Client Not Found" currentUser={currentUser}>
        <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
          <Building2 className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
          <h2 className="text-base font-semibold text-white">Client Not Found</h2>
          <p className="text-xs text-dark-muted mt-1 mb-4">
            The requested client profile does not exist or has been removed.
          </p>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Clients
          </Link>
        </div>
      </AppShell>
    );
  }

  const teamAssignments = client.teamAssignments || [];
  const contentCalendars = client.contentCalendars || [];
  const approvals = client.approvals || [];

  return (
    <AppShell
      title={client.brandName}
      subtitle={`Client Profile & Google Workspace Asset Hub • ${client.industry}`}
      currentUser={currentUser}
    >
      <div className="space-y-8">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs text-dark-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Client Roster</span>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-dark-card hover:bg-dark-border border border-dark-border text-xs text-gray-200 hover:text-white font-medium transition-all"
                >
                  <Edit className="w-3.5 h-3.5 text-brand-400" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={handleDeleteClient}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
                  title="Delete Client"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Client Hero Overview Card */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-dark-border relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {client.brandName}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    client.status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : client.status === "ON_HOLD"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                  }`}
                >
                  {client.status.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    client.priority === "HIGH"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {client.priority} PRIORITY
                </span>
              </div>

              <p className="text-sm text-gray-300">
                <span className="text-brand-400 font-semibold">{client.industry}</span> • Client since {formatDate(client.startDate)}
              </p>

              {/* Services Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-dark-muted font-medium">Services:</span>
                {client.services.split(",").map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-dark-bg border border-dark-border text-gray-200 font-medium"
                  >
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Primary Contact Details */}
            <div className="p-4 rounded-xl bg-dark-bg/80 border border-dark-border space-y-2 min-w-[260px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-dark-subtle">
                Primary Client Contact
              </p>
              <p className="text-sm font-semibold text-white">
                {client.contactPerson}
              </p>
              <div className="space-y-1 text-xs text-dark-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <a
                    href={`mailto:${client.contactEmail}`}
                    className="hover:text-brand-300 transition-colors"
                  >
                    {client.contactEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a
                    href={`tel:${client.contactPhone}`}
                    className="hover:text-emerald-300 transition-colors"
                  >
                    {client.contactPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Workspace Resource Hub (Section 18 in PRD) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-accent-cyan" />
                Google Workspace & Asset Hub
              </h3>
              <p className="text-xs text-dark-muted">
                One-click access to official Google Drive folders, brand manuals, and briefs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Google Drive Master Folder */}
            {client.googleDriveFolder ? (
              <a
                href={client.googleDriveFolder}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel glass-panel-hover p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Google Drive Folder</h4>
                  <p className="text-[11px] text-dark-muted">Master repository of raw files, exports & visuals</p>
                </div>
                <div className="pt-3 mt-3 border-t border-dark-border/60 text-xs font-semibold text-blue-400 flex items-center gap-1">
                  Open Drive Folder ↗
                </div>
              </a>
            ) : (
              <div className="glass-panel p-4 rounded-2xl border border-dark-border opacity-50 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-dark-bg text-dark-subtle w-fit">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-medium text-dark-muted">Google Drive Folder</h4>
                  <p className="text-[11px] text-dark-subtle">No link attached</p>
                </div>
              </div>
            )}

            {/* Brand Guidelines */}
            {client.brandGuidelinesUrl ? (
              <a
                href={client.brandGuidelinesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel glass-panel-hover p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Palette className="w-5 h-5" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Brand Guidelines</h4>
                  <p className="text-[11px] text-dark-muted">Typography, color palettes, tone of voice, logos</p>
                </div>
                <div className="pt-3 mt-3 border-t border-dark-border/60 text-xs font-semibold text-purple-400 flex items-center gap-1">
                  View Style Guide ↗
                </div>
              </a>
            ) : (
              <div className="glass-panel p-4 rounded-2xl border border-dark-border opacity-50 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-dark-bg text-dark-subtle w-fit">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-medium text-dark-muted">Brand Guidelines</h4>
                  <p className="text-[11px] text-dark-subtle">No style guide linked</p>
                </div>
              </div>
            )}

            {/* Client Brief */}
            {client.clientBriefUrl ? (
              <a
                href={client.clientBriefUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel glass-panel-hover p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Strategy Brief</h4>
                  <p className="text-[11px] text-dark-muted">Client onboarding questionnaire & target personas</p>
                </div>
                <div className="pt-3 mt-3 border-t border-dark-border/60 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  Read Client Brief ↗
                </div>
              </a>
            ) : (
              <div className="glass-panel p-4 rounded-2xl border border-dark-border opacity-50 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-dark-bg text-dark-subtle w-fit">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-medium text-dark-muted">Strategy Brief</h4>
                  <p className="text-[11px] text-dark-subtle">No brief attached</p>
                </div>
              </div>
            )}

            {/* Campaign Docs */}
            {client.campaignDocsUrl ? (
              <a
                href={client.campaignDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel glass-panel-hover p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Layers className="w-5 h-5" />
                    </div>
                    <ExternalLink className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Campaign & Performance</h4>
                  <p className="text-[11px] text-dark-muted">Ad metrics, spend trackers & deliverable matrices</p>
                </div>
                <div className="pt-3 mt-3 border-t border-dark-border/60 text-xs font-semibold text-amber-400 flex items-center gap-1">
                  View Campaign Sheet ↗
                </div>
              </a>
            ) : (
              <div className="glass-panel p-4 rounded-2xl border border-dark-border opacity-50 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-dark-bg text-dark-subtle w-fit">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-medium text-dark-muted">Campaign Docs</h4>
                  <p className="text-[11px] text-dark-subtle">No docs linked</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Grid: Assigned Creative Team & Content Calendars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Creative Team */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-border flex flex-col">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-brand-400" />
              Assigned Creative Team
            </h3>

            <div className="space-y-3 flex-1">
              {client.accountManager && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Account Manager
                    </span>
                    <p className="text-xs font-semibold text-white">
                      {client.accountManager.name}
                    </p>
                    <p className="text-[11px] text-dark-muted">
                      {client.accountManager.email}
                    </p>
                  </div>
                  <a
                    href={`mailto:${client.accountManager.email}`}
                    className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {teamAssignments.length === 0 ? (
                <p className="text-xs text-dark-muted italic">No team members assigned</p>
              ) : (
                teamAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border/80 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                        {assignment.role.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs font-semibold text-white">
                        {assignment.user.name}
                      </p>
                      <p className="text-[11px] text-dark-muted">
                        {assignment.user.designation}
                      </p>
                    </div>
                    <a
                      href={`mailto:${assignment.user.email}`}
                      className="p-1.5 rounded-lg bg-dark-card border border-dark-border text-dark-muted hover:text-white"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Content Calendars Directory for this Client */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-dark-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-400" />
                    Content Calendar Google Sheets
                  </h3>
                  <p className="text-xs text-dark-muted">
                    Access monthly Google Sheets and check approval deadlines
                  </p>
                </div>
              </div>

              {contentCalendars.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-dark-bg/50 border border-dark-border">
                  <CalendarDays className="w-6 h-6 text-dark-subtle mx-auto mb-2" />
                  <p className="text-xs text-dark-muted">No content calendars linked for this client</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contentCalendars.map((cal: any) => (
                    <div
                      key={cal.id}
                      className="p-4 rounded-xl bg-dark-bg/60 border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {cal.month} {cal.year}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              cal.status === "APPROVED" || cal.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {cal.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        {cal.nextDeadline && (
                          <p className="text-xs text-dark-muted flex items-center gap-1">
                            <Clock className="w-3 h-3 text-dark-subtle" />
                            Next Content Deadline:{" "}
                            <span className="text-gray-200 font-medium">
                              {formatDate(cal.nextDeadline)}
                            </span>
                          </p>
                        )}
                      </div>

                      <a
                        href={cal.googleSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glowEmerald flex items-center gap-2 transition-all shrink-0"
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Open Google Sheet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Notes Section */}
            {client.internalNotes && (
              <div className="pt-4 mt-6 border-t border-dark-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-subtle mb-1">
                  Internal Agency Notes
                </p>
                <p className="text-xs text-gray-300 bg-dark-bg/50 p-3 rounded-xl border border-dark-border">
                  {client.internalNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      <ClientFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchClient}
        clientToEdit={client}
      />
    </AppShell>
  );
}
