"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { CurrentUser } from "@/types";
import { useRouter } from "next/navigation";
import { InactivityGuard } from "@/components/auth/InactivityGuard";
import { useAuth } from "@/components/auth/AuthProvider";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  currentUser?: CurrentUser | null;
  onOpenNewClientModal?: () => void;
  onOpenLeaveModal?: () => void;
}

export function AppShell({
  children,
  title,
  subtitle,
  currentUser: propUser,
  onOpenNewClientModal,
  onOpenLeaveModal,
}: AppShellProps) {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const currentUser = propUser || authUser;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
      {/* 15-minute Inactivity Auto-Logout Tracker */}
      <InactivityGuard />

      {/* Left Sidebar (Persistent Desktop & Drawer Mobile) */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="pl-0 md:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Navbar */}
        <TopNavbar
          title={title}
          subtitle={subtitle}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenNewClientModal={onOpenNewClientModal}
          onOpenLeaveModal={onOpenLeaveModal}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
