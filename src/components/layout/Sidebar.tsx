"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  PlaneTakeoff,
  Megaphone,
  History,
  ShieldCheck,
  Sparkles,
  LogOut,
  ChevronRight,
  Send,
  X,
} from "lucide-react";
import { CurrentUser } from "@/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentUser?: CurrentUser | null;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentUser, onLogout, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = currentUser?.role === "ADMIN";
  const isOutreachAuthorized =
    isAdmin ||
    currentUser?.email?.toLowerCase().includes("kshitij") ||
    currentUser?.designation?.toLowerCase().includes("web") ||
    currentUser?.designation?.toLowerCase().includes("developer") ||
    currentUser?.department?.toLowerCase().includes("web") ||
    currentUser?.department?.toLowerCase().includes("dev");

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "EMPLOYEE"],
      badge: null,
      visible: true,
    },
    {
      name: "Cold Outreach",
      href: "/outreach",
      icon: Send,
      roles: ["ADMIN", "EMPLOYEE"],
      badge: "Zoho",
      visible: isOutreachAuthorized,
    },
    {
      name: "Clients & Assets",
      href: "/clients",
      icon: Building2,
      roles: ["ADMIN", "EMPLOYEE"],
      badge: null,
    },
    {
      name: "Content Calendars",
      href: "/calendars",
      icon: CalendarDays,
      roles: ["ADMIN", "EMPLOYEE"],
      badge: "Sheets",
    },
    {
      name: "Team Directory",
      href: "/team",
      icon: Users,
      roles: ["ADMIN", "EMPLOYEE"],
      badge: null,
    },
    {
      name: "Leave Requests",
      href: "/leaves",
      icon: PlaneTakeoff,
      roles: ["ADMIN", "EMPLOYEE"],
      badge: null,
    },
    {
      name: "Announcements",
      href: "/announcements",
      icon: Megaphone,
      roles: ["ADMIN", "EMPLOYEE"],
      badge: null,
    },
    {
      name: "Activity Audit Log",
      href: "/activity",
      icon: History,
      roles: ["ADMIN"],
      badge: "Admin",
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      {/* Brand Header */}
      <div>
        <div className="p-4 sm:p-5 border-b border-dark-border flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">
                  Lynk<span className="text-brand-400">Digital</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-dark-muted">Agency Operations Hub</p>
            </div>
          </Link>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="overflow-y-auto px-3 py-4 space-y-1 max-h-[calc(100vh-160px)]">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-dark-subtle">
            Main Menu
          </div>
          {navigationItems
            .filter(
              (item) =>
                item.visible !== false &&
                (!item.roles || (currentUser && item.roles.includes(currentUser.role)))
            )
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm"
                      : "text-gray-400 hover:text-gray-200 hover:bg-dark-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-brand-400"
                          : "text-gray-400 group-hover:text-gray-200"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide",
                        isActive
                          ? "bg-brand-500/30 text-brand-200"
                          : "bg-dark-border text-dark-muted"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-3 sm:p-4 border-t border-dark-border mt-auto">
        {currentUser ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-dark-card border border-dark-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                {currentUser.name.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-200 truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <ShieldCheck className="w-3 h-3 text-brand-400 shrink-0" />
                  )}
                  <p className="text-[11px] text-dark-muted truncate">
                    {currentUser.role === "ADMIN" ? "Administrator" : currentUser.designation}
                  </p>
                </div>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition-colors shadow-glow"
          >
            Sign In to CRM
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-dark-card border-r border-dark-border flex-col fixed left-0 top-0 z-30 select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Slide-over */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
          />

          {/* Drawer Content */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-dark-card border-r border-dark-border shadow-2xl z-10 flex flex-col animate-slideRight select-none">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
