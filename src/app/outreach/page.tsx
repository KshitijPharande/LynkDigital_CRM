"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CsvImportModal } from "@/components/outreach/CsvImportModal";
import { OutreachAccountsModal } from "@/components/outreach/OutreachAccountsModal";
import {
  Send,
  RefreshCw,
  Sparkles,
  Mail,
  UserCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Lead {
  id: string;
  businessName: string;
  email: string;
  region: string | null;
  originalSubject: string;
  originalBody: string;
  zohoMessageId: string;
  dateSent: string;
  senderEmail: string;
  senderName: string;
  status: string;
  followupDraft: string | null;
  followupSentDate: string | null;
  followup2Draft: string | null;
  followup2SentDate: string | null;
  breakupDraft: string | null;
  breakupSentDate: string | null;
  notes: string | null;
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState({ total: 0, due: 0, drafts: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"due" | "drafts" | "sent" | "replied" | "all">("due");
  const [selectedSender, setSelectedSender] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  // Expanded lead draft cards
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [generatingDraft, setGeneratingDraft] = useState<Record<string, boolean>>({});
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        tab: activeTab,
        sender: selectedSender,
        search: searchQuery,
      });

      const res = await fetch(`/api/outreach/leads?${params.toString()}`);
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
      if (data.counts) setCounts(data.counts);

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) {
        const u = meData.user;
        const isAllowed =
          u.role === "ADMIN" ||
          u.department?.toLowerCase().includes("web") ||
          u.department?.toLowerCase().includes("dev") ||
          u.designation?.toLowerCase().includes("web") ||
          u.designation?.toLowerCase().includes("developer");

        if (!isAllowed) {
          window.location.href = "/dashboard";
          return;
        }
        setCurrentUser(u);
      }
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedSender, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Zoho Inbox & Sent folder sync
  const handleSync = async () => {
    setSyncing(true);
    setSyncNotice(null);
    try {
      const res = await fetch("/api/outreach/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: selectedSender !== "ALL" ? selectedSender : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");

      setSyncNotice(
        `Sync complete for ${data.senderEmail}: ${data.newLeadsCount} new leads found, ${data.repliedCount} replies recorded, ${data.dueCount} follow-ups marked due.`
      );
      fetchLeads();
    } catch (err: any) {
      setSyncNotice(`Sync Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Generate Groq AI draft
  const handleGenerateDraft = async (leadId: string, stage: 1 | 2 | 3) => {
    setGeneratingDraft((prev) => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, stage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate draft");

      setDraftEdits((prev) => ({ ...prev, [leadId]: data.draft }));
      fetchLeads();
    } catch (err: any) {
      alert(`AI Draft Error: ${err.message}`);
    } finally {
      setGeneratingDraft((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  // Send Follow-Up via Zoho with Re: threading
  const handleSendEmail = async (lead: Lead, stage: 1 | 2 | 3) => {
    const content =
      draftEdits[lead.id] ||
      (stage === 1
        ? lead.followupDraft
        : stage === 2
        ? lead.followup2Draft
        : lead.breakupDraft);

    if (!content) {
      alert("Please generate or enter email draft content first.");
      return;
    }

    if (
      !confirm(
        `Send Follow-up #${stage} to ${lead.businessName} (${lead.email}) from ${lead.senderEmail}?`
      )
    ) {
      return;
    }

    setSendingEmail((prev) => ({ ...prev, [lead.id]: true }));
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          stage,
          content,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      fetchLeads();
    } catch (err: any) {
      alert(`Send Error: ${err.message}`);
    } finally {
      setSendingEmail((prev) => ({ ...prev, [lead.id]: false }));
    }
  };

  // 1-Click Status Update (e.g. Mark as Replied)
  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      const res = await fetch(`/api/outreach/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      fetchLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save notes
  const handleSaveNotes = async (leadId: string, notes: string) => {
    try {
      await fetch(`/api/outreach/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "replied":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold";
      case "due_for_followup_1":
      case "due_for_followup_2":
      case "due_for_breakup":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold animate-pulse";
      case "followup_1_drafted":
      case "followup_2_drafted":
      case "breakup_drafted":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "followup_1_sent":
      case "followup_2_sent":
      case "breakup_sent":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-dark-border text-dark-muted border-dark-borderLight";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "due_for_followup_1":
        return "Day 4: Follow-up #1 Due";
      case "followup_1_drafted":
        return "Follow-up #1 Draft Ready";
      case "followup_1_sent":
        return "Follow-up #1 Sent";
      case "due_for_followup_2":
        return "Day 8: Follow-up #2 Due";
      case "followup_2_drafted":
        return "Follow-up #2 Draft Ready";
      case "followup_2_sent":
        return "Follow-up #2 Sent";
      case "due_for_breakup":
        return "Day 12: Break-up Due";
      case "breakup_drafted":
        return "Break-up Draft Ready";
      case "breakup_sent":
        return "Break-up Sent (Sequence Done)";
      case "replied":
        return "Replied (Active Lead)";
      case "pending":
        return "Waiting (Day 0-3)";
      default:
        return status.replace(/_/g, " ");
    }
  };

  return (
    <AppShell
      title="Cold Email Outreach & Follow-Up Hub"
      subtitle="Automated 4/8/12-day follow-up sequences, Groq AI drafting, and multi-inbox Zoho sync"
      currentUser={currentUser}
    >
      <div className="space-y-6">
        {/* Sync Notice Alert */}
        {syncNotice && (
          <div className="glass-panel p-4 rounded-2xl border border-brand-500/30 bg-brand-950/20 flex items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5 text-gray-200">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-dark-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Control Bar & KPI Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <div className="glass-panel p-3.5 rounded-xl border border-dark-border">
              <span className="text-[11px] text-dark-muted block">Total Prospects</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {counts.total}
              </span>
            </div>

            <div className="glass-panel p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <span className="text-[11px] text-amber-400 font-semibold block">
                Due for Follow-Up
              </span>
              <span className="text-xl font-bold text-amber-300 mt-1 block">
                {counts.due}
              </span>
            </div>

            <div className="glass-panel p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <span className="text-[11px] text-blue-400 font-semibold block">
                AI Drafts Ready
              </span>
              <span className="text-xl font-bold text-blue-300 mt-1 block">
                {counts.drafts}
              </span>
            </div>

            <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[11px] text-emerald-400 font-semibold block">
                Replies Received
              </span>
              <span className="text-xl font-bold text-emerald-300 mt-1 block">
                {counts.replied}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing Zoho..." : "Sync Zoho Mail"}</span>
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-dark-card border border-dark-border hover:border-dark-borderLight text-gray-200 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setIsAccountsModalOpen(true)}
              title="Configure Zoho Inboxes (Kshitij & Swarada)"
              className="p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted hover:text-white hover:border-dark-borderLight transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters & Pipeline Tabs */}
        <div className="glass-panel p-4 rounded-2xl border border-dark-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-dark-bg/60 p-1.5 rounded-xl border border-dark-border w-fit">
              <button
                onClick={() => setActiveTab("due")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "due"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Due for Follow-Up ({counts.due})
              </button>

              <button
                onClick={() => setActiveTab("drafts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "drafts"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Drafts Ready ({counts.drafts})
              </button>

              <button
                onClick={() => setActiveTab("sent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "sent"
                    ? "bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Active Sequences
              </button>

              <button
                onClick={() => setActiveTab("replied")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "replied"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Replied ({counts.replied})
              </button>

              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "all"
                    ? "bg-dark-card text-white border border-dark-borderLight shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                All Prospects ({counts.total})
              </button>
            </div>

            {/* Sender Filter Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-muted hidden sm:inline">Sender:</span>
              <select
                value={selectedSender}
                onChange={(e) => setSelectedSender(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Senders (Combined)</option>
                <option value="kshitij@lynkdigital.co.in">Kshitij Pharande</option>
                <option value="swarada@lynkdigital.co.in">Swarada</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-dark-subtle absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by prospect business name, email, or subject..."
              className="w-full bg-dark-bg/80 border border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Lead Stream List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-dark-card rounded-2xl" />
            <div className="h-28 bg-dark-card rounded-2xl" />
            <div className="h-28 bg-dark-card rounded-2xl" />
          </div>
        ) : leads.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
            <Mail className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No prospects in this tab</h3>
            <p className="text-xs text-dark-muted mt-1 mb-4">
              Click &quot;Sync Zoho Mail&quot; or import a CSV list to populate your outreach stream.
            </p>
            <button
              onClick={handleSync}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-glow hover:bg-brand-500"
            >
              Sync Zoho Inboxes Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const isExpanded = expandedLeadId === lead.id;
              const currentDraft =
                draftEdits[lead.id] !== undefined
                  ? draftEdits[lead.id]
                  : lead.followupDraft ||
                    lead.followup2Draft ||
                    lead.breakupDraft ||
                    "";

              const isFollowup1Due =
                lead.status === "due_for_followup_1" ||
                lead.status === "followup_1_drafted";
              const isFollowup2Due =
                lead.status === "due_for_followup_2" ||
                lead.status === "followup_2_drafted";
              const isBreakupDue =
                lead.status === "due_for_breakup" ||
                lead.status === "breakup_drafted";

              const activeStage: 1 | 2 | 3 = isBreakupDue
                ? 3
                : isFollowup2Due
                ? 2
                : 1;

              return (
                <div
                  key={lead.id}
                  className="glass-panel rounded-2xl border border-dark-border p-5 space-y-4 hover:border-dark-borderLight transition-all"
                >
                  {/* Lead Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">
                          {lead.businessName}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          {formatStatusLabel(lead.status)}
                        </span>
                        {lead.region && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-dark-muted">
                            {lead.region}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-dark-muted">
                        <a
                          href={`mailto:${lead.email}`}
                          className="hover:text-brand-400 transition-colors"
                        >
                          {lead.email}
                        </a>
                        <span>•</span>
                        <span>
                          Sender:{" "}
                          <strong className="text-gray-300">
                            {lead.senderName}
                          </strong>{" "}
                          ({lead.senderEmail})
                        </span>
                        <span>•</span>
                        <span>Sent: {formatDate(lead.dateSent)}</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.status !== "replied" && (
                        <button
                          onClick={() => handleUpdateStatus(lead.id, "replied")}
                          title="Mark as Replied"
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Replied</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedLeadId(isExpanded ? null : lead.id)
                        }
                        className="px-3 py-1.5 rounded-xl bg-dark-bg/80 border border-dark-border hover:border-brand-500/40 text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                        <span>
                          {currentDraft ? "Review AI Draft" : "Draft Follow-Up"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-dark-muted" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-dark-muted" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subject Line & Original Context Preview */}
                  <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border/80 text-xs space-y-1">
                    <p className="font-semibold text-gray-300">
                      Subject: {lead.originalSubject}
                    </p>
                    <p className="text-dark-muted text-[11px] line-clamp-2">
                      {lead.originalBody}
                    </p>
                  </div>

                  {/* Expanded AI Draft & Action Box */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-dark-border space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                            {activeStage === 3
                              ? "Final Break-Up Email Draft"
                              : `Follow-Up #${activeStage} Draft`}
                          </span>
                          <span className="text-[10px] text-dark-muted">
                            (Will send as direct reply in original thread: Re: {lead.originalSubject})
                          </span>
                        </div>

                        {/* Regenerate with Groq AI */}
                        <button
                          onClick={() =>
                            handleGenerateDraft(lead.id, activeStage)
                          }
                          disabled={generatingDraft[lead.id]}
                          className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              generatingDraft[lead.id] ? "animate-spin" : ""
                            }`}
                          />
                          <span>
                            {generatingDraft[lead.id]
                              ? "Groq Drafting..."
                              : "Regenerate Draft with AI"}
                          </span>
                        </button>
                      </div>

                      {/* Draft Textarea */}
                      <textarea
                        rows={4}
                        value={currentDraft}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [lead.id]: e.target.value,
                          }))
                        }
                        placeholder="Click 'Regenerate Draft' or type your follow-up email..."
                        className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500 font-sans leading-relaxed"
                      />

                      {/* Footer Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-dark-muted">
                          Sending from:{" "}
                          <strong className="text-gray-200">
                            {lead.senderEmail}
                          </strong>{" "}
                          via Zoho Mail
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleSendEmail(lead, activeStage)
                            }
                            disabled={
                              sendingEmail[lead.id] || !currentDraft.trim()
                            }
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {sendingEmail[lead.id]
                                ? "Sending via Zoho..."
                                : `Send Follow-up #${activeStage} (Re:)`}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={fetchLeads}
        defaultSenderEmail={
          selectedSender !== "ALL"
            ? selectedSender
            : currentUser?.email || "kshitij@lynkdigital.co.in"
        }
        defaultSenderName={currentUser?.name || "Kshitij Pharande"}
      />

      {/* Zoho Accounts Configuration Modal */}
      <OutreachAccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        onSuccess={fetchLeads}
      />
    </AppShell>
  );
}
