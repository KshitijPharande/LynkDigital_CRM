"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Plus,
  Shield,
  UserCheck,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { CurrentUser } from "@/types";
import { CommandSearchModal } from "@/components/search/CommandSearchModal";

interface TopNavbarProps {
  currentUser?: CurrentUser | null;
  title?: string;
  subtitle?: string;
  onOpenNewClientModal?: () => void;
  onOpenLeaveModal?: () => void;
  onSwitchUser?: (role: "ADMIN" | "EMPLOYEE") => void;
}

export function TopNavbar({
  currentUser,
  title,
  subtitle,
  onOpenNewClientModal,
  onOpenLeaveModal,
  onSwitchUser,
}: TopNavbarProps) {
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <>
      <header className="h-16 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Title / Breadcrumb */}
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">
            {title || "Overview"}
          </h1>
          {subtitle && (
            <p className="text-xs text-dark-muted hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Middle Search Bar Trigger */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center w-80 relative cursor-pointer group"
        >
          <Search className="w-4 h-4 text-dark-subtle group-hover:text-brand-400 absolute left-3 pointer-events-none transition-colors" />
          <div className="w-full bg-dark-card border border-dark-border group-hover:border-dark-borderLight text-xs rounded-xl pl-9 pr-12 py-2 text-dark-muted transition-all select-none">
            Quick search CRM...
          </div>
          <div className="absolute right-2.5 px-1.5 py-0.5 rounded bg-dark-border/80 border border-dark-borderLight text-[10px] font-medium text-dark-muted pointer-events-none">
            Ctrl+K
          </div>
        </div>

        {/* Right Controls & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Role Quick Switcher for testing/demo */}
          {onSwitchUser && (
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-gray-300 hover:text-white hover:border-dark-borderLight transition-all"
              >
                {isAdmin ? (
                  <Shield className="w-3.5 h-3.5 text-brand-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="font-medium">
                  {isAdmin ? "Admin View" : "Employee View"}
                </span>
                <ChevronDown className="w-3 h-3 text-dark-muted" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-glass py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-dark-subtle border-b border-dark-border">
                    Switch Persona Demo
                  </div>
                  <button
                    onClick={() => {
                      onSwitchUser("ADMIN");
                      setShowRoleSwitcher(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-gray-200 hover:bg-dark-border/50 flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-brand-400" />
                    <div>
                      <p className="font-semibold text-white">Alex Morgan (Admin)</p>
                      <p className="text-[10px] text-dark-muted">Full Agency Control</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onSwitchUser("EMPLOYEE");
                      setShowRoleSwitcher(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-gray-200 hover:bg-dark-border/50 flex items-center gap-2"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <p className="font-semibold text-white">Sarah Chen (SMM)</p>
                      <p className="text-[10px] text-dark-muted">Assigned Team View</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Button */}
          {isAdmin && onOpenNewClientModal && (
            <button
              onClick={onOpenNewClientModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>
          )}

          {!isAdmin && onOpenLeaveModal && (
            <button
              onClick={onOpenLeaveModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glowEmerald transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply Leave</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            title="Notifications"
            className="relative p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted hover:text-gray-200 hover:border-dark-borderLight transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
          </button>

          {/* Google Workspace Quick Link */}
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Google Drive Hub"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-dark-card border border-dark-border text-[11px] text-dark-muted hover:text-brand-400 transition-colors"
          >
            <span>Drive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Global Command Search Modal */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
