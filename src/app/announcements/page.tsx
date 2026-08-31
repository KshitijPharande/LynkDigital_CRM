"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AnnouncementModal } from "@/components/announcements/AnnouncementModal";
import {
  Megaphone,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);

      const res = await fetch("/api/announcements");
      const data = await res.json();
      if (data.announcements) setAnnouncements(data.announcements);
    } catch (err) {
      console.error("Error loading announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <AppShell
      title="Company Announcements & Noticeboard"
      subtitle="Agency-wide communications, client policy updates, and team notifications"
      currentUser={currentUser}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-dark-muted">
            All team members receive updates published to this board
          </p>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Announcement</span>
            </button>
          )}
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-dark-border h-36" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
            <Megaphone className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No announcements yet</p>
            <p className="text-xs text-dark-muted mt-1">
              Check back later for company news and operational updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => {
              const isUrgent = item.priority === "URGENT";
              const isHigh = item.priority === "HIGH";

              return (
                <div
                  key={item.id}
                  className={`glass-panel p-6 rounded-2xl border transition-all ${
                    isUrgent
                      ? "border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-dark-card to-dark-card shadow-sm"
                      : isHigh
                      ? "border-blue-500/30 bg-gradient-to-r from-blue-950/20 via-dark-card to-dark-card"
                      : "border-dark-border"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Priority Badge, Date, Delete */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                            isUrgent
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                              : isHigh
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-dark-bg text-dark-muted border-dark-border"
                          }`}
                        >
                          {item.priority} NOTICE
                        </span>
                        <span className="text-xs text-dark-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-dark-subtle" />
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded-lg text-dark-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Announcement Title */}
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {item.title}
                    </h3>

                    {/* Content Body */}
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {/* Author Footer */}
                    <div className="pt-3 border-t border-dark-border/60 flex items-center gap-2 text-xs text-dark-muted">
                      <div className="w-5 h-5 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center font-bold text-[9px] text-brand-300">
                        {item.author.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>
                        Posted by <strong className="text-white">{item.author.name}</strong> ({item.author.designation})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAnnouncements}
      />
    </AppShell>
  );
}
