"use client";

import React, { useState } from "react";
import {
  Search,
  Bell,
  Plus,
  Shield,
  UserCheck,
  ExternalLink,
  Menu,
} from "lucide-react";
import { CurrentUser } from "@/types";
import { CommandSearchModal } from "@/components/search/CommandSearchModal";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface TopNavbarProps {
  currentUser?: CurrentUser | null;
  title?: string;
  subtitle?: string;
  onOpenNewClientModal?: () => void;
  onOpenLeaveModal?: () => void;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

export function TopNavbar({
  currentUser,
  title,
  subtitle,
  onOpenNewClientModal,
  onOpenLeaveModal,
  onToggleMobileMenu,
}: TopNavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <>
      <header className="h-16 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Mobile Menu Trigger & Title / Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted hover:text-white transition-colors shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
              {title || "Overview"}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-dark-muted hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Middle Search Bar Trigger (Desktop) */}
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted hover:text-white transition-colors"
            title="Search CRM"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* User Role Badge (Desktop only on small screens) */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-gray-300">
              {isAdmin ? (
                <Shield className="w-3.5 h-3.5 text-brand-400" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="font-medium">
                {isAdmin ? "Administrator" : "Team Member"}
              </span>
            </div>
          )}

          {/* Quick Action Button */}
          {isAdmin && onOpenNewClientModal && (
            <button
              onClick={onOpenNewClientModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Client</span>
            </button>
          )}

          {!isAdmin && onOpenLeaveModal && (
            <button
              onClick={onOpenLeaveModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-glowEmerald transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apply Leave</span>
            </button>
          )}

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />

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
