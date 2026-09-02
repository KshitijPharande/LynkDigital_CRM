"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle } from "lucide-react";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultSenderEmail?: string;
  defaultSenderName?: string;
}

export function CsvImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultSenderEmail,
  defaultSenderName,
}: CsvImportModalProps) {
  const [csvText, setCsvText] = useState("");
  const [senderEmail, setSenderEmail] = useState(defaultSenderEmail || "kshitij@lynkdigital.co.in");
  const [senderName, setSenderName] = useState(defaultSenderName || "Kshitij Pharande");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content || "");
    };
    reader.readAsText(file);
  };

  const parseCsvToLeads = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0]
      .split(",")
      .map((h) => h.replace(/["\r]/g, "").trim().toLowerCase());

    const businessIdx = headers.findIndex(
      (h) =>
        h.includes("business") ||
        h.includes("company") ||
        h.includes("name") ||
        h === "lead"
    );
    const emailIdx = headers.findIndex(
      (h) => h.includes("email") || h.includes("mail")
    );
    const regionIdx = headers.findIndex(
      (h) =>
        h.includes("region") ||
        h.includes("location") ||
        h.includes("city") ||
        h.includes("country")
    );

    const leads = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((c) => c.replace(/["\r]/g, "").trim());
      const businessName = businessIdx !== -1 ? row[businessIdx] : row[0];
      const email = emailIdx !== -1 ? row[emailIdx] : row[1];
      const region = regionIdx !== -1 ? row[regionIdx] : null;

      if (businessName && email && email.includes("@")) {
        leads.push({ businessName, email, region });
      }
    }

    return leads;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const parsedLeads = parseCsvToLeads(csvText);

      if (parsedLeads.length === 0) {
        throw new Error(
          "Could not parse valid leads. Ensure CSV has headers like: Business Name, Email, Region"
        );
      }

      const res = await fetch("/api/outreach/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: parsedLeads,
          senderEmail,
          senderName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import leads");

      setSuccessMsg(
        `Successfully imported ${data.importedCount} leads! (${data.skippedCount} duplicates skipped)`
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-lg w-full p-6 shadow-glass relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Import Leads from CSV
              </h3>
              <p className="text-xs text-dark-muted">
                Bulk inject prospects into your cold outreach stream
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
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Sender Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Assign Sender Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Kshitij Pharande"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Assign Sender Email
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g. kshitij@lynkdigital.co.in"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-dark-border hover:border-brand-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-dark-bg/40 relative">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-6 h-6 text-brand-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300 font-medium">
                Click or drag & drop CSV file
              </p>
              <p className="text-[10px] text-dark-muted mt-0.5">
                Headers: Business Name, Email, Region
              </p>
            </div>
          </div>

          {/* Or Paste CSV Text */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Or Paste CSV Data Directly
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Business Name, Email, Region&#10;Acme Studio, contact@acme.com, Mumbai&#10;Apex Brand, info@apex.com, London"
              className="w-full bg-dark-bg border border-dark-border rounded-xl p-3 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-dark-muted hover:text-white hover:bg-dark-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !csvText.trim()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
            >
              {loading ? "Importing Leads..." : "Import Leads"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
