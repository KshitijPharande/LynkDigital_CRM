"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ApprovalModal } from "@/components/approvals/ApprovalModal";
import {
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ExternalLink,
  Building2,
  AlertCircle,
  Kanban,
  Table as TableIcon,
  ChevronRight,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvalToEdit, setApprovalToEdit] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/approvals");
      const data = await res.json();
      if (data.approvals) setApprovals(data.approvals);

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);
    } catch (err) {
      console.error("Error loading approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleUpdateStatus = async (approvalId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchApprovals();
      }
    } catch (err) {
      console.error("Approval status update error:", err);
    }
  };

  const stages = [
    { key: "DRAFT", label: "Draft", color: "text-gray-400 border-gray-500/20 bg-gray-500/5" },
    { key: "SENT_TO_CLIENT", label: "Sent to Client", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
    { key: "CHANGES_REQUESTED", label: "Changes Requested", color: "text-rose-400 border-rose-500/20 bg-rose-500/5" },
    { key: "APPROVED", label: "Approved", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
    { key: "SCHEDULED", label: "Scheduled", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
    { key: "PUBLISHED", label: "Published", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
  ];

  const types = ["ALL", "Reel", "Carousel", "Static Post", "Video", "Ad Banner", "Copy Draft"];

  const filteredApprovals = approvals.filter((item) => {
    const matchesType =
      selectedType === "ALL" || item.deliverableType === selectedType;
    const matchesSearch =
      item.deliverableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const pendingClientCount = approvals.filter(
    (a) => a.status === "SENT_TO_CLIENT" || a.status === "CHANGES_REQUESTED"
  ).length;

  return (
    <AppShell
      title="Client Approval Tracker"
      subtitle="Track deliverables sent to clients, turnaround times, feedback, and publishing pipelines"
      currentUser={currentUser}
    >
      <div className="space-y-6">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-dark-subtle absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deliverable or client..."
                className="w-full bg-dark-card border border-dark-border text-xs rounded-xl pl-9 pr-3 py-2 text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Asset Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-dark-card border border-dark-border text-xs rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-brand-500"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t === "ALL" ? "All Deliverable Types" : t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-dark-card border border-dark-border rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === "kanban"
                    ? "bg-brand-600 text-white shadow-glow"
                    : "text-dark-muted hover:text-white"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-brand-600 text-white shadow-glow"
                    : "text-dark-muted hover:text-white"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* Log Deliverable Button */}
            <button
              onClick={() => {
                setApprovalToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Deliverable</span>
            </button>
          </div>
        </div>

        {/* Kanban Pipeline View */}
        {viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageItems = filteredApprovals.filter(
                (item) => item.status === stage.key
              );

              return (
                <div
                  key={stage.key}
                  className="bg-dark-card/50 border border-dark-border rounded-2xl p-3 flex flex-col min-w-[240px] max-h-[75vh]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-dark-border px-1">
                    <span className="text-xs font-bold text-gray-200 tracking-tight">
                      {stage.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dark-bg border border-dark-border text-dark-muted">
                      {stageItems.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                    {stageItems.length === 0 ? (
                      <p className="text-[11px] text-dark-subtle italic text-center py-6">
                        Empty stage
                      </p>
                    ) : (
                      stageItems.map((item) => (
                        <div
                          key={item.id}
                          className="glass-panel glass-panel-hover p-3 rounded-xl border border-dark-border space-y-2.5 flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            {/* Client & Type Tags */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider truncate">
                                {item.client.brandName}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-bg border border-dark-border text-gray-300 font-medium shrink-0">
                                {item.deliverableType}
                              </span>
                            </div>

                            {/* Deliverable Title */}
                            <p className="text-xs font-semibold text-white leading-tight">
                              {item.deliverableName}
                            </p>

                            {/* Days Pending Counter */}
                            <div className="flex items-center justify-between text-[10px] pt-1">
                              <span className="text-dark-muted">
                                Sent {formatDate(item.sentDate)}
                              </span>
                              {item.status === "SENT_TO_CLIENT" && (
                                <span
                                  className={`font-bold px-1.5 py-0.5 rounded ${
                                    item.daysPending >= 4
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : item.daysPending >= 2
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-blue-500/10 text-blue-300"
                                  }`}
                                >
                                  {item.daysPending}d pending
                                </span>
                              )}
                            </div>

                            {/* Notes / Feedback */}
                            {item.notes && (
                              <p className="text-[10px] text-gray-300 bg-dark-bg/80 p-2 rounded-lg border border-dark-border line-clamp-2">
                                {item.notes}
                              </p>
                            )}
                          </div>

                          {/* Quick Actions / Link */}
                          <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-[11px]">
                            {item.previewUrl ? (
                              <a
                                href={item.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                              >
                                <span>Preview</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-dark-subtle text-[10px]">
                                No preview
                              </span>
                            )}

                            <button
                              onClick={() => {
                                setApprovalToEdit(item);
                                setIsModalOpen(true);
                              }}
                              className="text-dark-muted hover:text-white font-medium px-1.5 py-0.5 rounded hover:bg-dark-border"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-bg/80 border-b border-dark-border text-dark-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Client</th>
                    <th className="px-4 py-3.5 font-semibold">Deliverable</th>
                    <th className="px-4 py-3.5 font-semibold">Type</th>
                    <th className="px-4 py-3.5 font-semibold">Sent Date</th>
                    <th className="px-4 py-3.5 font-semibold">Days Pending</th>
                    <th className="px-4 py-3.5 font-semibold">Status Stage</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/60">
                  {filteredApprovals.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-dark-border/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/clients/${item.client.id}`}
                          className="font-semibold text-white hover:text-brand-400 transition-colors"
                        >
                          {item.client.brandName}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-200 max-w-xs">
                        <p className="truncate">{item.deliverableName}</p>
                        {item.notes && (
                          <p className="text-[10px] text-dark-muted truncate mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-gray-300">
                          {item.deliverableType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-dark-muted">
                        {formatDate(item.sentDate)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`font-semibold text-xs px-2 py-0.5 rounded ${
                            item.daysPending >= 4
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : item.daysPending >= 2
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "text-dark-muted"
                          }`}
                        >
                          {item.daysPending} days
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateStatus(item.id, e.target.value)
                          }
                          className="bg-dark-bg border border-dark-border text-xs rounded-lg px-2 py-1 text-white focus:outline-none cursor-pointer"
                        >
                          {stages.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.previewUrl && (
                            <a
                              href={item.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-dark-card border border-dark-border text-brand-400 hover:text-white"
                              title="Preview Deliverable"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setApprovalToEdit(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-border transition-colors text-[11px]"
                          >
                            Edit
                          </button>
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

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setApprovalToEdit(null);
        }}
        onSuccess={fetchApprovals}
        approvalToEdit={approvalToEdit}
      />
    </AppShell>
  );
}
