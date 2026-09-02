"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Plus, Trash2, KeyRound, Check, AlertCircle, RefreshCw } from "lucide-react";

interface OutreachAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OutreachAccountsModal({
  isOpen,
  onClose,
  onSuccess,
}: OutreachAccountsModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [dataCenter, setDataCenter] = useState("in");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/outreach/accounts");
      const data = await res.json();
      if (data.accounts) setAccounts(data.accounts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/outreach/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderEmail,
          refreshToken,
          dataCenter,
          clientId: clientId.trim() || undefined,
          clientSecret: clientSecret.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save Zoho account");

      setSuccessMsg(`Zoho account for ${senderName} saved successfully!`);
      setShowAddForm(false);
      setSenderName("");
      setSenderEmail("");
      setRefreshToken("");
      fetchAccounts();
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove Zoho account for ${name}?`)) return;
    try {
      await fetch(`/api/outreach/accounts?id=${id}`, { method: "DELETE" });
      fetchAccounts();
      onSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-xl w-full p-6 shadow-glass relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Zoho Sender Inboxes
              </h3>
              <p className="text-xs text-dark-muted">
                Manage cold email sending accounts (Kshitij & Swarada)
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

        {/* Existing Accounts List */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">
              Connected Accounts ({accounts.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddForm ? "Close Form" : "Add Sender Account"}
            </button>
          </div>

          {accounts.length === 0 && !showAddForm && (
            <div className="p-6 text-center rounded-xl bg-dark-bg/50 border border-dark-border">
              <KeyRound className="w-6 h-6 text-dark-subtle mx-auto mb-2" />
              <p className="text-xs text-dark-muted">
                No custom Zoho accounts connected yet. Using fallback environment credentials.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">
                      {acc.senderName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">
                      .{acc.dataCenter}
                    </span>
                  </div>
                  <p className="text-xs text-dark-muted mt-0.5">{acc.senderEmail}</p>
                </div>

                <button
                  onClick={() => handleDelete(acc.id, acc.senderName)}
                  className="p-2 rounded-lg text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <form onSubmit={handleAddAccount} className="mt-4 pt-4 border-t border-dark-border space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Sender Name *
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Swarada"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Sender Email (Zoho) *
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="swarada@lynkdigital.co.in"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                Zoho Refresh Token *
              </label>
              <input
                type="text"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="1000.xxxxxxx.xxxxxxx"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Data Center
                </label>
                <select
                  value={dataCenter}
                  onChange={(e) => setDataCenter(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="in">India (.in)</option>
                  <option value="com">Global (.com)</option>
                  <option value="eu">Europe (.eu)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Client ID (Optional)
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Default env"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Client Secret (Optional)
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Default env"
                  className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-dark-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
              >
                {loading ? "Saving..." : "Save Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
