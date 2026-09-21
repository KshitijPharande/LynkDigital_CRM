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
import { useAuth } from "@/components/auth/AuthProvider";

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
  demoDraft: string | null;
  mockupUrl: string | null;
  demoSentDate: string | null;
  replySentiment: string | null;
  repliedAtStep: string | null;
  notes: string | null;
}

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    demoPending: 0,
    due1: 0,
    due2: 0,
    breakup: 0,
    replied: 0,
    dead: 0,
  });
  const [stats, setStats] = useState({
    firstEmailReplies: 0,
    fu1Replies: 0,
    fu2Replies: 0,
    breakupReplies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "demo_pending" | "due_1" | "due_2" | "breakup" | "replied" | "dead"
  >("all");
  const [selectedSender, setSelectedSender] = useState<string>(
    "kshitij.pharande@lynkdigital.co.in"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  // Expanded lead draft cards & mockup links
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [mockupInputs, setMockupInputs] = useState<Record<string, string>>({});
  const [generatingDraft, setGeneratingDraft] = useState<Record<string, boolean>>({});
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({});
  const { user: currentUser } = useAuth();

  // Race-condition guard: tracks latest request ID to ignore stale out-of-order network responses
  const latestFetchId = React.useRef(0);

  // Initialize current user and verify access
  useEffect(() => {
    if (currentUser) {
      const u = currentUser;
      const isAllowed =
        u.role === "ADMIN" ||
        u.email?.toLowerCase().includes("kshitij") ||
        u.department?.toLowerCase().includes("web") ||
        u.department?.toLowerCase().includes("dev") ||
        u.designation?.toLowerCase().includes("web") ||
        u.designation?.toLowerCase().includes("developer");

      if (!isAllowed) {
        window.location.href = "/dashboard";
        return;
      }

      const emailLower = u.email?.toLowerCase().trim() || "";
      if (emailLower.includes("swarada")) {
        setSelectedSender("swarada@lynkdigital.co.in");
      } else {
        setSelectedSender("kshitij.pharande@lynkdigital.co.in");
      }
    }
  }, [currentUser]);

  const fetchLeads = useCallback(
    async (showLoading = false) => {
      const fetchId = ++latestFetchId.current;
      try {
        if (showLoading) setLoading(true);
        const params = new URLSearchParams({
          tab: activeTab,
          sender: selectedSender,
          search: searchQuery,
        });

        const res = await fetch(`/api/outreach/leads?${params.toString()}`);
        const data = await res.json();

        // Discard stale out-of-order responses
        if (fetchId !== latestFetchId.current) return;

        if (data.leads) setLeads(data.leads);
        if (data.counts) setCounts(data.counts);
        if (data.stats) setStats(data.stats);
      } catch (err) {
        console.error("Failed to load leads:", err);
      } finally {
        if (fetchId === latestFetchId.current && showLoading) {
          setLoading(false);
        }
      }
    },
    [activeTab, selectedSender, searchQuery]
  );

  useEffect(() => {
    fetchLeads(true);
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
      fetchLeads(false);
    } catch (err: any) {
      setSyncNotice(`Sync Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Generate Groq AI draft (in-place state update without full page reloading)
  const handleGenerateDraft = async (leadId: string, stage: 1 | 2 | 3 | 4) => {
    setGeneratingDraft((prev) => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          stage,
          mockupUrl: mockupInputs[leadId] || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate draft");

      setDraftEdits((prev) => ({ ...prev, [leadId]: data.draft }));
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                ...(stage === 1
                  ? { followupDraft: data.draft }
                  : stage === 2
                  ? { followup2Draft: data.draft }
                  : stage === 3
                  ? { breakupDraft: data.draft }
                  : { demoDraft: data.draft }),
              }
            : l
        )
      );
    } catch (err: any) {
      alert(`AI Draft Error: ${err.message}`);
    } finally {
      setGeneratingDraft((prev) => ({ ...prev, [leadId]: false }));
    }
  };

  // Apply Mockup Link to draft
  const handleApplyMockupLink = (leadId: string, url: string, currentContent: string) => {
    setMockupInputs((prev) => ({ ...prev, [leadId]: url }));
    if (!url.trim()) return;

    let updated = currentContent;
    if (updated.includes("{{MOCKUP_LINK}}")) {
      updated = updated.replace(/\{\{MOCKUP_LINK\}\}/g, url.trim());
    } else {
      // If no placeholder, ensure link is injected
      updated = `${updated.trim()}\n\nMockup preview: ${url.trim()}`;
    }
    setDraftEdits((prev) => ({ ...prev, [leadId]: updated }));
  };

  // Send Follow-Up or Demo via Zoho in thread
  const handleSendEmail = async (lead: Lead, stage: 1 | 2 | 3 | 4) => {
    let content =
      draftEdits[lead.id] ||
      (stage === 1
        ? lead.followupDraft
        : stage === 2
        ? lead.followup2Draft
        : stage === 3
        ? lead.breakupDraft
        : lead.demoDraft);

    // Safety guard: Check for unresolved {{...}} placeholders
    if (content && /\{\{[^{}]+\}\}/.test(content)) {
      const match = content.match(/\{\{[^{}]+\}\}/g)?.[0] || "{{placeholder}}";
      alert(
        `Blocked Sending: Please paste your real mockup URL or replace ${match} before sending this email.`
      );
      return;
    }

    setSendingEmail((prev) => ({ ...prev, [lead.id]: true }));

    try {
      // 1. If draft doesn't exist yet, auto-generate via Groq AI first
      if (!content) {
        const draftRes = await fetch("/api/outreach/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            stage,
            mockupUrl: mockupInputs[lead.id] || undefined,
          }),
        });
        const draftData = await draftRes.json();
        if (!draftRes.ok) throw new Error(draftData.error || "Failed to generate AI draft");
        content = draftData.draft;
        setDraftEdits((prev) => ({ ...prev, [lead.id]: content || "" }));

        if (content && /\{\{[^{}]+\}\}/.test(content)) {
          alert("Draft generated with {{MOCKUP_LINK}}. Please paste your real mockup URL before sending.");
          setSendingEmail((prev) => ({ ...prev, [lead.id]: false }));
          return;
        }
      }

      // 2. Send email via Zoho in the same thread (Re:)
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

      const label =
        stage === 4
          ? "Demo Mockup Email"
          : stage === 3
          ? "Break-Up Email"
          : `Follow-up #${stage}`;

      setSyncNotice(
        `Sent ${label} to ${lead.businessName} (${lead.email}) from ${lead.senderEmail}!`
      );

      // Optimistic in-place update
      const nextStatus =
        stage === 1
          ? "followup_1_sent"
          : stage === 2
          ? "followup_2_sent"
          : stage === 3
          ? "breakup_sent"
          : "demo_sent";

      setLeads((prev) => {
        if (
          activeTab === "demo_pending" ||
          activeTab === "due_1" ||
          activeTab === "due_2" ||
          activeTab === "breakup"
        ) {
          return prev.filter((l) => l.id !== lead.id);
        }
        return prev.map((l) =>
          l.id === lead.id ? { ...l, status: nextStatus } : l
        );
      });

      setCounts((prev) => ({
        ...prev,
        demoPending: stage === 4 && prev.demoPending > 0 ? prev.demoPending - 1 : prev.demoPending,
        due1: stage === 1 && prev.due1 > 0 ? prev.due1 - 1 : prev.due1,
        due2: stage === 2 && prev.due2 > 0 ? prev.due2 - 1 : prev.due2,
        breakup: stage === 3 && prev.breakup > 0 ? prev.breakup - 1 : prev.breakup,
      }));

      fetchLeads(false);
    } catch (err: any) {
      alert(`Send Error: ${err.message}`);
    } finally {
      setSendingEmail((prev) => ({ ...prev, [lead.id]: false }));
    }
  };

  // 1-Click Status Update
  const handleUpdateStatus = async (leadId: string, status: string) => {
    setLeads((prev) => {
      if (
        activeTab === "demo_pending" ||
        activeTab === "due_1" ||
        activeTab === "due_2" ||
        activeTab === "breakup" ||
        (activeTab === "replied" && status !== "replied") ||
        (activeTab === "dead" && status !== "dead" && status !== "closed")
      ) {
        return prev.filter((l) => l.id !== leadId);
      }
      return prev.map((l) => (l.id === leadId ? { ...l, status } : l));
    });

    try {
      const res = await fetch(`/api/outreach/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      fetchLeads(false);
    } catch (err: any) {
      alert(err.message);
      fetchLeads(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "demo_pending":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse";
      case "demo_sent":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold";
      case "manual_reply_needed":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold";
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
      case "dead":
      case "closed":
        return "bg-zinc-800 text-zinc-400 border-zinc-700 font-medium";
      default:
        return "bg-dark-border text-dark-muted border-dark-borderLight";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "demo_pending":
        return "🔥 Demo Pending (Reply Interested)";
      case "demo_sent":
        return "Demo Mockup Sent";
      case "manual_reply_needed":
        return "⚠️ Manual Reply Needed (Inquiry)";
      case "due_for_followup_1":
        return "Day 3: Follow-up #1 Due";
      case "followup_1_drafted":
        return "Follow-up #1 Draft Ready";
      case "followup_1_sent":
        return "Follow-up #1 Sent";
      case "due_for_followup_2":
        return "Day 5: Follow-up #2 Due";
      case "followup_2_drafted":
        return "Follow-up #2 Draft Ready";
      case "followup_2_sent":
        return "Follow-up #2 Sent";
      case "due_for_breakup":
        return "Day 7: Break-up Due";
      case "breakup_drafted":
        return "Break-up Draft Ready";
      case "breakup_sent":
        return "Break-up Sent (Awaiting final 2 days)";
      case "replied":
        return "Replied (Active Lead)";
      case "dead":
      case "closed":
        return "Closed / Dead (Sequence Finished)";
      case "pending":
        return "Waiting (Day 1-2)";
      default:
        return status.replace(/_/g, " ");
    }
  };

  const formatStepAttribution = (step: string | null) => {
    if (!step) return null;
    switch (step) {
      case "first_email":
        return "Replied to: Initial Pitch (Day 1)";
      case "followup_1":
        return "Replied to: Follow-Up #1 (Day 3)";
      case "followup_2":
        return "Replied to: Follow-Up #2 (Day 5)";
      case "breakup":
        return "Replied to: Breakup (Day 7)";
      default:
        return `Replied at: ${step}`;
    }
  };

  return (
    <AppShell
      title="Cold Email Outreach & Follow-Up Hub"
      subtitle="Automated 1/3/5/7-day follow-up cadence, demo mockup workflow, and multi-inbox Zoho sync"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 flex-1">
            <div className="glass-panel p-3 rounded-xl border border-dark-border">
              <span className="text-[10px] text-dark-muted block font-medium uppercase tracking-wider">
                Total Leads
              </span>
              <span className="text-lg font-bold text-white mt-0.5 block">
                {counts.total}
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-rose-500/30 bg-rose-500/10">
              <span className="text-[10px] text-rose-400 font-bold block uppercase tracking-wider flex items-center gap-1">
                🔥 Demo Due
              </span>
              <span className="text-lg font-extrabold text-rose-300 mt-0.5 block">
                {counts.demoPending}
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <span className="text-[10px] text-amber-400 font-semibold block uppercase tracking-wider">
                Day 3: FU #1
              </span>
              <span className="text-lg font-bold text-amber-300 mt-0.5 block">
                {counts.due1}
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <span className="text-[10px] text-orange-400 font-semibold block uppercase tracking-wider">
                Day 5: FU #2
              </span>
              <span className="text-lg font-bold text-orange-300 mt-0.5 block">
                {counts.due2}
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <span className="text-[10px] text-rose-400 font-semibold block uppercase tracking-wider">
                Day 7: Breakup
              </span>
              <span className="text-lg font-bold text-rose-300 mt-0.5 block">
                {counts.breakup}
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-[10px] text-emerald-400 font-semibold block uppercase tracking-wider">
                All Replied
              </span>
              <span className="text-lg font-bold text-emerald-300 mt-0.5 block">
                {counts.replied}
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-zinc-700/40 bg-zinc-900/40">
              <span className="text-[10px] text-zinc-400 font-semibold block uppercase tracking-wider">
                Closed / Dead
              </span>
              <span className="text-lg font-bold text-zinc-300 mt-0.5 block">
                {counts.dead}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Zoho Mail"}</span>
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-dark-card border border-dark-border hover:border-dark-borderLight text-gray-200 text-xs font-medium transition-all flex items-center gap-1.5"
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

        {/* Step Attribution Analytics Ribbon */}
        {(stats.firstEmailReplies > 0 || stats.fu1Replies > 0 || stats.fu2Replies > 0 || stats.breakupReplies > 0) && (
          <div className="glass-panel p-3 rounded-xl border border-brand-500/20 bg-brand-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-brand-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sequence Reply Attribution:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="text-gray-300">
                Initial Pitch (Day 1): <strong className="text-white font-bold">{stats.firstEmailReplies}</strong> replies
              </span>
              <span className="text-dark-muted">•</span>
              <span className="text-gray-300">
                FU #1 (Day 3): <strong className="text-amber-300 font-bold">{stats.fu1Replies}</strong> replies
              </span>
              <span className="text-dark-muted">•</span>
              <span className="text-gray-300">
                FU #2 (Day 5): <strong className="text-orange-300 font-bold">{stats.fu2Replies}</strong> replies
              </span>
              <span className="text-dark-muted">•</span>
              <span className="text-gray-300">
                Breakup (Day 7): <strong className="text-rose-300 font-bold">{stats.breakupReplies}</strong> replies
              </span>
            </div>
          </div>
        )}

        {/* Filters & Pipeline Tabs */}
        <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-dark-border space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Stage Tabs */}
            <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-dark-bg/60 p-1.5 rounded-xl border border-dark-border w-full lg:w-fit">
              <button
                onClick={() => setActiveTab("all")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeTab === "all"
                    ? "bg-dark-card text-white border border-dark-borderLight shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                All ({counts.total})
              </button>

              <button
                onClick={() => setActiveTab("demo_pending")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === "demo_pending"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                    : counts.demoPending > 0
                    ? "text-rose-400 hover:text-rose-300 font-bold"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                <span>🔥 Demo Pending</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
                  {counts.demoPending}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("pending")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeTab === "pending"
                    ? "bg-dark-card text-white border border-dark-borderLight shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Waiting (Day 1-2) ({counts.pending || 0})
              </button>

              <button
                onClick={() => setActiveTab("due_1")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeTab === "due_1"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Day 3: FU #1 ({counts.due1})
              </button>

              <button
                onClick={() => setActiveTab("due_2")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeTab === "due_2"
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Day 5: FU #2 ({counts.due2})
              </button>

              <button
                onClick={() => setActiveTab("breakup")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeTab === "breakup"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Day 7: Break-Up ({counts.breakup})
              </button>

              <button
                onClick={() => setActiveTab("replied")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeTab === "replied"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Replied ({counts.replied})
              </button>

              <button
                onClick={() => setActiveTab("dead")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  activeTab === "dead"
                    ? "bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-sm"
                    : "text-dark-muted hover:text-gray-300"
                }`}
              >
                Closed ({counts.dead})
              </button>
            </div>

            {/* Sender Filter Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-muted hidden sm:inline">Inbox:</span>
              <select
                value={selectedSender}
                onChange={(e) => setSelectedSender(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="kshitij.pharande@lynkdigital.co.in">
                  Kshitij Pharande {currentUser?.email?.includes("kshitij") ? "(My Outreach)" : ""}
                </option>
                <option value="swarada@lynkdigital.co.in">
                  Swarada {currentUser?.email?.includes("swarada") ? "(My Outreach)" : ""}
                </option>
                {currentUser?.role === "ADMIN" && (
                  <option value="ALL">All Agency Inboxes (Admin Combined)</option>
                )}
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
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border space-y-3">
            <Mail className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">
              {activeTab === "demo_pending"
                ? "No positive demo requests pending right now"
                : (activeTab === "due_1" || activeTab === "due_2" || activeTab === "breakup") && counts.total > 0
                ? "No follow-ups due in this stage today"
                : "No prospects in this tab"}
            </h3>
            <p className="text-xs text-dark-muted max-w-md mx-auto">
              {(activeTab === "due_1" || activeTab === "due_2" || activeTab === "breakup") && counts.total > 0
                ? "Prospects in this sequence are waiting for their scheduled 2-day interval. They will automatically appear here when due."
                : 'Click "Sync Zoho Mail" or import a CSV list to populate your outreach stream.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {counts.total > 0 && activeTab !== "all" && (
                <button
                  onClick={() => setActiveTab("all")}
                  className="px-4 py-2 rounded-xl bg-dark-bg border border-dark-border text-white text-xs font-semibold hover:border-brand-500/50 transition-all"
                >
                  View All Prospects ({counts.total})
                </button>
              )}
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-glow hover:bg-brand-500 disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync Zoho Mail Now"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => {
              const isExpanded = expandedLeadId === lead.id;
              const isDemoPending = lead.status === "demo_pending";

              const currentDraft =
                draftEdits[lead.id] !== undefined
                  ? draftEdits[lead.id]
                  : isDemoPending
                  ? lead.demoDraft || ""
                  : lead.followupDraft ||
                    lead.followup2Draft ||
                    lead.breakupDraft ||
                    lead.demoDraft ||
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

              const activeStage: 1 | 2 | 3 | 4 = isDemoPending
                ? 4
                : isBreakupDue
                ? 3
                : isFollowup2Due
                ? 2
                : 1;

              const hasUnresolvedPlaceholders =
                Boolean(currentDraft) && /\{\{[^{}]+\}\}/.test(currentDraft);

              return (
                <div
                  key={lead.id}
                  className={`glass-panel rounded-2xl border p-5 space-y-4 transition-all ${
                    isDemoPending
                      ? "border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-950/20"
                      : "border-dark-border hover:border-dark-borderLight"
                  }`}
                >
                  {/* Lead Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
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
                        {lead.repliedAtStep && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-brand-500/30 text-brand-300 font-medium">
                            {formatStepAttribution(lead.repliedAtStep)}
                          </span>
                        )}
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
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Direct 1-Click Send Button */}
                      {lead.status !== "replied" &&
                        lead.status !== "closed" &&
                        lead.status !== "dead" &&
                        lead.status !== "demo_sent" && (
                          <button
                            onClick={() => handleSendEmail(lead, activeStage)}
                            disabled={
                              sendingEmail[lead.id] ||
                              (isDemoPending && hasUnresolvedPlaceholders)
                            }
                            title={
                              isDemoPending && hasUnresolvedPlaceholders
                                ? "Paste your mockup URL before sending"
                                : "Send via Zoho Mail"
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold shadow-glow flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 ${
                              isDemoPending
                                ? "bg-rose-600 hover:bg-rose-500"
                                : "bg-brand-600 hover:bg-brand-500"
                            }`}
                          >
                            <Send className={`w-3.5 h-3.5 ${sendingEmail[lead.id] ? "animate-spin" : ""}`} />
                            <span>
                              {sendingEmail[lead.id]
                                ? "Sending via Zoho..."
                                : isDemoPending
                                ? "Send Demo Mockup (Re:)"
                                : activeStage === 3
                                ? "Send Break-Up (Re:)"
                                : `Send Follow-Up #${activeStage} (Re:)`}
                            </span>
                          </button>
                        )}

                      {lead.status !== "replied" && !isDemoPending && (
                        <button
                          onClick={() => handleUpdateStatus(lead.id, "replied")}
                          title="Mark as Replied"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Replied</span>
                        </button>
                      )}

                      {lead.status !== "closed" && lead.status !== "dead" && (
                        <button
                          onClick={() => handleUpdateStatus(lead.id, "closed")}
                          title="Mark as Closed / Opt-out"
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Close</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedLeadId(isExpanded ? null : lead.id)
                        }
                        title="Review or Customize AI Email Draft"
                        className="px-2.5 py-1.5 rounded-xl bg-dark-bg/80 border border-dark-border hover:border-brand-500/40 text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                        <span>
                          {currentDraft ? "Edit Draft" : "Preview AI Draft"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-dark-muted" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-dark-muted" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notes / Response Summary if available */}
                  {lead.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{lead.notes}</span>
                    </div>
                  )}

                  {/* Demo Pending Quick Mockup URL Input Box */}
                  {isDemoPending && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                      <label className="text-xs font-bold text-rose-200 block">
                        🔗 Step 1: Paste Your Created Mockup URL:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={mockupInputs[lead.id] || lead.mockupUrl || ""}
                          onChange={(e) =>
                            handleApplyMockupLink(lead.id, e.target.value, currentDraft)
                          }
                          placeholder="https://lynkdigital.co.in/mockups/client-name"
                          className="flex-1 bg-dark-bg border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-rose-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!mockupInputs[lead.id]) {
                              alert("Please enter a mockup URL first.");
                              return;
                            }
                            handleApplyMockupLink(
                              lead.id,
                              mockupInputs[lead.id],
                              currentDraft
                            );
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 shadow-sm"
                        >
                          Insert Link
                        </button>
                      </div>

                      {hasUnresolvedPlaceholders && (
                        <p className="text-[11px] text-rose-300 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Sending is locked until {"{{MOCKUP_LINK}}"} is replaced with a real link.
                        </p>
                      )}
                    </div>
                  )}

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
                            {activeStage === 4
                              ? "Demo Mockup Email Draft"
                              : activeStage === 3
                              ? "Final Break-Up Email Draft (Day 7)"
                              : `Follow-Up #${activeStage} Draft (Day ${activeStage === 1 ? "3" : "5"})`}
                          </span>
                          <span className="text-[10px] text-dark-muted">
                            (Will send as direct reply in original thread: Re: {lead.originalSubject})
                          </span>
                        </div>

                        {/* Regenerate with Groq AI */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleGenerateDraft(lead.id, activeStage);
                          }}
                          disabled={generatingDraft[lead.id]}
                          className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
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
                        rows={5}
                        value={currentDraft}
                        onChange={(e) =>
                          setDraftEdits((prev) => ({
                            ...prev,
                            [lead.id]: e.target.value,
                          }))
                        }
                        placeholder="Type or customize your email draft..."
                        className={`w-full bg-dark-bg border rounded-xl p-3 text-xs text-white placeholder-dark-subtle focus:outline-none font-sans leading-relaxed ${
                          hasUnresolvedPlaceholders
                            ? "border-rose-500/60 focus:border-rose-400"
                            : "border-dark-border focus:border-brand-500"
                        }`}
                      />

                      {hasUnresolvedPlaceholders && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>
                            Safety Lock: Draft contains unresolved placeholders (e.g. {"{{MOCKUP_LINK}}"}). You must provide the real link before sending.
                          </span>
                        </div>
                      )}

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
                              sendingEmail[lead.id] ||
                              !currentDraft.trim() ||
                              hasUnresolvedPlaceholders
                            }
                            className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40 ${
                              isDemoPending
                                ? "bg-rose-600 hover:bg-rose-500"
                                : "bg-brand-600 hover:bg-brand-500"
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {sendingEmail[lead.id]
                                ? "Sending via Zoho..."
                                : isDemoPending
                                ? "Send Demo Mockup (Re:)"
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
