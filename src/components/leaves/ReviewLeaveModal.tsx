"use client";

import React, { useState } from "react";
import { X, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReviewLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveToReview: any | null;
}

export function ReviewLeaveModal({
  isOpen,
  onClose,
  onSuccess,
  leaveToReview,
}: ReviewLeaveModalProps) {
  const [adminComment, setAdminComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !leaveToReview) return null;

  const handleDecision = async (status: "APPROVED" | "REJECTED") => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/leaves/${leaveToReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process leave");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6 shadow-glass relative">
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Review Leave Application
              </h3>
              <p className="text-xs text-dark-muted">
                Admin approval decision and feedback notes
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

        {/* Applicant Details */}
        <div className="mt-4 p-3.5 rounded-xl bg-dark-bg border border-dark-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-sm">
              {leaveToReview.user.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">
              {leaveToReview.leaveType}
            </span>
          </div>
          <p className="text-dark-muted">
            {leaveToReview.user.designation} • {leaveToReview.user.department}
          </p>
          <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-gray-200">
            <span>
              {formatDate(leaveToReview.startDate)} to {formatDate(leaveToReview.endDate)}
            </span>
            <span className="font-bold text-brand-400">
              {leaveToReview.daysCount} Day(s)
            </span>
          </div>
          <p className="pt-2 border-t border-dark-border/60 text-gray-300 italic">
            "{leaveToReview.reason}"
          </p>
        </div>

        {/* Admin Comments */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-medium text-gray-300">
            Admin Feedback / Approval Remarks (Optional)
          </label>
          <textarea
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            rows={2}
            placeholder="e.g. Approved. Please ensure all September sheets are handed over."
            className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-5 mt-4 border-t border-dark-border">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision("REJECTED")}
            className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Leave</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDecision("APPROVED")}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glowEmerald flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
