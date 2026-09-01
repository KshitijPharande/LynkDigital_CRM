"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  FolderKanban,
  FileText,
  Palette,
  ExternalLink,
  Users,
  Shield,
  Layers,
} from "lucide-react";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientToEdit?: any | null;
}

export function ClientFormModal({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
}: ClientFormModalProps) {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [accountManagerId, setAccountManagerId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [priority, setPriority] = useState("MEDIUM");
  const [services, setServices] = useState("Social Media Marketing, Content Creation, Paid Ads");
  const [internalNotes, setInternalNotes] = useState("");

  // Google Workspace links
  const [googleDriveFolder, setGoogleDriveFolder] = useState("");
  const [brandGuidelinesUrl, setBrandGuidelinesUrl] = useState("");
  const [clientBriefUrl, setClientBriefUrl] = useState("");
  const [campaignDocsUrl, setCampaignDocsUrl] = useState("");

  // Team selection
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedSmm, setSelectedSmm] = useState("");
  const [selectedDesigner, setSelectedDesigner] = useState("");
  const [selectedVideoEditor, setSelectedVideoEditor] = useState("");
  const [selectedCopywriter, setSelectedCopywriter] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available team members
  useEffect(() => {
    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => setAvailableUsers(data.users || []))
      .catch((err) => console.error(err));
  }, []);

  // Populate form if editing
  useEffect(() => {
    if (clientToEdit) {
      setBrandName(clientToEdit.brandName || "");
      setIndustry(clientToEdit.industry || "");
      setContactPerson(clientToEdit.contactPerson || "");
      setContactEmail(clientToEdit.contactEmail || "");
      setContactPhone(clientToEdit.contactPhone || "");
      setAccountManagerId(clientToEdit.accountManagerId || "");
      setStatus(clientToEdit.status || "ACTIVE");
      setPriority(clientToEdit.priority || "MEDIUM");
      setServices(clientToEdit.services || "");
      setInternalNotes(clientToEdit.internalNotes || "");
      setGoogleDriveFolder(clientToEdit.googleDriveFolder || "");
      setBrandGuidelinesUrl(clientToEdit.brandGuidelinesUrl || "");
      setClientBriefUrl(clientToEdit.clientBriefUrl || "");
      setCampaignDocsUrl(clientToEdit.campaignDocsUrl || "");

      // Pre-select team assignments if present
      if (clientToEdit.teamAssignments) {
        const smm = clientToEdit.teamAssignments.find(
          (a: any) => a.role === "SOCIAL_MEDIA_MANAGER"
        );
        const designer = clientToEdit.teamAssignments.find(
          (a: any) => a.role === "DESIGNER"
        );
        const video = clientToEdit.teamAssignments.find(
          (a: any) => a.role === "VIDEO_EDITOR"
        );
        const copy = clientToEdit.teamAssignments.find(
          (a: any) => a.role === "COPYWRITER"
        );

        if (smm) setSelectedSmm(smm.userId);
        if (designer) setSelectedDesigner(designer.userId);
        if (video) setSelectedVideoEditor(video.userId);
        if (copy) setSelectedCopywriter(copy.userId);
      }
    } else {
      // Reset form
      setBrandName("");
      setIndustry("");
      setContactPerson("");
      setContactEmail("");
      setContactPhone("");
      setAccountManagerId("");
      setStatus("ACTIVE");
      setPriority("MEDIUM");
      setServices("Social Media Marketing, Content Creation, Paid Ads");
      setInternalNotes("");
      setGoogleDriveFolder("");
      setBrandGuidelinesUrl("");
      setClientBriefUrl("");
      setCampaignDocsUrl("");
      setSelectedSmm("");
      setSelectedDesigner("");
      setSelectedVideoEditor("");
      setSelectedCopywriter("");
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const teamMembers: { userId: string; role: string }[] = [];
    if (accountManagerId) {
      teamMembers.push({ userId: accountManagerId, role: "ACCOUNT_MANAGER" });
    }
    if (selectedSmm) {
      teamMembers.push({ userId: selectedSmm, role: "SOCIAL_MEDIA_MANAGER" });
    }
    if (selectedDesigner) {
      teamMembers.push({ userId: selectedDesigner, role: "DESIGNER" });
    }
    if (selectedVideoEditor) {
      teamMembers.push({ userId: selectedVideoEditor, role: "VIDEO_EDITOR" });
    }
    if (selectedCopywriter) {
      teamMembers.push({ userId: selectedCopywriter, role: "COPYWRITER" });
    }

    const payload = {
      brandName,
      industry,
      contactPerson,
      contactEmail,
      contactPhone,
      accountManagerId: accountManagerId || null,
      status,
      priority,
      services,
      internalNotes,
      googleDriveFolder,
      brandGuidelinesUrl,
      clientBriefUrl,
      campaignDocsUrl,
      teamMembers,
    };

    try {
      const url = clientToEdit
        ? `/api/clients/${clientToEdit.id}`
        : "/api/clients";
      const method = clientToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save client");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-glass relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {clientToEdit ? "Edit Client Profile" : "Add New Agency Client"}
              </h3>
              <p className="text-xs text-dark-muted">
                Configure brand information, creative team, and Google asset links
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Section 1: Basic Brand Info */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 block mb-2.5">
              1. Brand & Contact Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Brand / Company Name *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Apex Athletics"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Industry / Niche (Optional)
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Sportswear & E-Commerce"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Primary Contact Person (Optional)
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Carlos Rivera"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="carlos@apex.com"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Contact Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DROPPED">Dropped</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Team Assignment */}
          <div className="pt-3 border-t border-dark-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2.5">
              2. Agency Team Roles
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Account Manager
                </label>
                <select
                  value={accountManagerId}
                  onChange={(e) => setAccountManagerId(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Select Account Manager --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Social Media Manager
                </label>
                <select
                  value={selectedSmm}
                  onChange={(e) => setSelectedSmm(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Select SMM --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Graphic Designer
                </label>
                <select
                  value={selectedDesigner}
                  onChange={(e) => setSelectedDesigner(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Select Designer --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Video Editor / Motion
                </label>
                <select
                  value={selectedVideoEditor}
                  onChange={(e) => setSelectedVideoEditor(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Select Video Editor --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Copywriter & Content Strategist
                </label>
                <select
                  value={selectedCopywriter}
                  onChange={(e) => setSelectedCopywriter(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Select Copywriter --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Google Workspace Links */}
          <div className="pt-3 border-t border-dark-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-cyan block mb-2.5">
              3. Google Workspace Asset Links
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Google Drive Folder URL
                </label>
                <input
                  type="url"
                  value={googleDriveFolder}
                  onChange={(e) => setGoogleDriveFolder(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Brand Guidelines URL
                </label>
                <input
                  type="url"
                  value={brandGuidelinesUrl}
                  onChange={(e) => setBrandGuidelinesUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Client Brief Document URL
                </label>
                <input
                  type="url"
                  value={clientBriefUrl}
                  onChange={(e) => setClientBriefUrl(e.target.value)}
                  placeholder="https://docs.google.com/document/d/.../edit"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Campaign / Strategy Docs URL
                </label>
                <input
                  type="url"
                  value={campaignDocsUrl}
                  onChange={(e) => setCampaignDocsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Services & Internal Notes */}
          <div className="pt-3 border-t border-dark-border space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Services Scope
              </label>
              <input
                type="text"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="e.g. Social Media Management, Short-form Video, Meta Ads"
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Internal Account Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="Key client preferences, approval turnaround times, review cadences..."
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
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
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : clientToEdit
                ? "Update Client"
                : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
