"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ApplyLeaveModal } from "@/components/leaves/ApplyLeaveModal";
import { ReviewLeaveModal } from "@/components/leaves/ReviewLeaveModal";
import {
  PlaneTakeoff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Calendar,
  Shield,
  Search,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [viewAll, setViewAll] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveToReview, setLeaveToReview] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) {
        setCurrentUser(meData.user);
      }

      const res = await fetch(`/api/leaves?viewAll=${viewAll}`);
      const data = await res.json();
      if (data.leaves) setLeaves(data.leaves);
    } catch (err) {
      console.error("Error loading leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [viewAll]);

  const isAdmin = currentUser?.role === "ADMIN";

  const statuses = [
    { label: "All Requests", value: "ALL" },
    { label: "Pending Review", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  const filteredLeaves = leaves.filter((leave) => {
    return selectedStatus === "ALL" || leave.status === selectedStatus;
  });

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;

  return (
    <AppShell
      title="Leave & Time-Off Management"
      subtitle="Submit time-off or WFH applications, review employee requests, and track approval status"
      currentUser={currentUser}
    >
      <div className="space-y-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <span className="text-xs font-medium text-dark-muted">Pending Review</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
              <span className="text-xs text-dark-subtle">Applications awaiting review</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <span className="text-xs font-medium text-dark-muted">Approved Leaves</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">{approvedCount}</span>
              <span className="text-xs text-dark-subtle">Total approved records</span>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-dark-muted">Apply For Time-Off</span>
              <p className="text-xs text-white font-semibold mt-1">Casual, Sick, or WFH</p>
            </div>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95"
            >
              + Apply Now
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-dark-card p-1 rounded-xl border border-dark-border overflow-x-auto text-xs">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(s.value)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedStatus === s.value
                    ? "bg-brand-600 text-white shadow-glow"
                    : "text-dark-muted hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Admin Scope Toggle & Apply Action */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="flex items-center bg-dark-card border border-dark-border rounded-xl p-1 text-xs">
                <button
                  onClick={() => setViewAll(true)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewAll
                      ? "bg-brand-600 text-white shadow-glow"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  All Team Leaves
                </button>
                <button
                  onClick={() => setViewAll(false)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    !viewAll
                      ? "bg-brand-600 text-white shadow-glow"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  My Leaves Only
                </button>
              </div>
            )}

            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply Leave</span>
            </button>
          </div>
        </div>

        {/* Leaves Table */}
        {loading ? (
          <div className="glass-panel rounded-2xl border border-dark-border p-8 animate-pulse h-64" />
        ) : filteredLeaves.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
            <PlaneTakeoff className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No leave requests found</p>
            <p className="text-xs text-dark-muted mt-1">
              Submit a leave application or check other status filters.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-dark-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-bg/80 border-b border-dark-border text-dark-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Employee</th>
                    <th className="px-4 py-3.5 font-semibold">Leave Type</th>
                    <th className="px-4 py-3.5 font-semibold">Dates & Duration</th>
                    <th className="px-4 py-3.5 font-semibold">Reason</th>
                    <th className="px-4 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions / Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/60">
                  {filteredLeaves.map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-dark-border/30 transition-colors"
                    >
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{leave.user.name}</p>
                        <p className="text-[11px] text-dark-muted">
                          {leave.user.designation}
                        </p>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {leave.leaveType}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-4 text-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-dark-subtle" />
                          <span>
                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                          </span>
                        </div>
                        <span className="text-[11px] text-brand-400 font-semibold">
                          {leave.daysCount} Day(s)
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-4 max-w-xs text-gray-300">
                        <p className="line-clamp-2">{leave.reason}</p>
                        {leave.adminComment && (
                          <p className="text-[10px] text-brand-400 mt-1 italic">
                            Admin: "{leave.adminComment}"
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            leave.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : leave.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {leave.status}
                        </span>
                        {leave.reviewedBy && (
                          <p className="text-[10px] text-dark-subtle mt-0.5">
                            by {leave.reviewedBy.name}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {isAdmin && leave.status === "PENDING" ? (
                          <button
                            onClick={() => setLeaveToReview(leave)}
                            className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
                          >
                            Review Decision
                          </button>
                        ) : (
                          <span className="text-dark-subtle text-[11px]">
                            {leave.status === "APPROVED" ? "Approved" : "Processed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={fetchLeaves}
      />

      <ReviewLeaveModal
        isOpen={!!leaveToReview}
        onClose={() => setLeaveToReview(null)}
        onSuccess={fetchLeaves}
        leaveToReview={leaveToReview}
      />
    </AppShell>
  );
}
