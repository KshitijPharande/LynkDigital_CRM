"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Link2, Clock, FileCheck } from "lucide-react";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  approvalToEdit?: any | null;
  defaultClientId?: string;
}

export function ApprovalModal({
  isOpen,
  onClose,
  onSuccess,
  approvalToEdit,
  defaultClientId,
}: ApprovalModalProps) {
  const [clientId, setClientId] = useState(defaultClientId || "");
  const [deliverableName, setDeliverableName] = useState("");
  const [deliverableType, setDeliverableType] = useState("Reel");
  const [sentDate, setSentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("SENT_TO_CLIENT");
  const [previewUrl, setPreviewUrl] = useState("");
  const [notes, setNotes] = useState("");

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
    if (approvalToEdit) {
      setClientId(approvalToEdit.clientId || "");
      setDeliverableName(approvalToEdit.deliverableName || "");
      setDeliverableType(approvalToEdit.deliverableType || "Reel");
      setSentDate(
        approvalToEdit.sentDate
          ? new Date(approvalToEdit.sentDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setStatus(approvalToEdit.status || "SENT_TO_CLIENT");
      setPreviewUrl(approvalToEdit.previewUrl || "");
      setNotes(approvalToEdit.notes || "");
    } else {
      setClientId(defaultClientId || "");
      setDeliverableName("");
      setDeliverableType("Reel");
      setSentDate(new Date().toISOString().split("T")[0]);
      setStatus("SENT_TO_CLIENT");
      setPreviewUrl("");
      setNotes("");
    }
  }, [approvalToEdit, defaultClientId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      clientId,
      deliverableName,
      deliverableType,
      sentDate,
      status,
      previewUrl,
      notes,
    };

    try {
      const url = approvalToEdit
        ? `/api/approvals/${approvalToEdit.id}`
        : "/api/approvals";
      const method = approvalToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save deliverable");

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
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {approvalToEdit ? "Edit Deliverable" : "Log Deliverable Approval"}
              </h3>
              <p className="text-xs text-dark-muted">
                Track creative asset sent to client for sign-off
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
              disabled={!!defaultClientId && !approvalToEdit}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Deliverable Name *
              </label>
              <input
                type="text"
                value={deliverableName}
                onChange={(e) => setDeliverableName(e.target.value)}
                placeholder="e.g. Instagram Reel 03 - Fall Teaser"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Asset Type
              </label>
              <select
                value={deliverableType}
                onChange={(e) => setDeliverableType(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Reel">Reel / TikTok</option>
                <option value="Carousel">Carousel</option>
                <option value="Static Post">Static Post</option>
                <option value="Video">Video Long-form</option>
                <option value="Ad Banner">Ad Banner</option>
                <option value="Copy Draft">Copy Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Sent to Client Date
              </label>
              <input
                type="date"
                value={sentDate}
                onChange={(e) => setSentDate(e.target.value)}
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Approval Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT_TO_CLIENT">Sent to Client</option>
                <option value="CHANGES_REQUESTED">Changes Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Preview / Asset Link (Drive, Figma, Loom)
            </label>
            <input
              type="url"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view"
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Feedback / Notes / Revisions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Client feedback notes or approval comments..."
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
            />
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
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : approvalToEdit
                ? "Update Deliverable"
                : "Log Deliverable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
