"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { CurrentUser } from "@/types";
import { useRouter } from "next/navigation";

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
  currentUser: initialUser,
  onOpenNewClientModal,
  onOpenLeaveModal,
}: AppShellProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(initialUser || null);

  useEffect(() => {
    if (!initialUser) {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : { user: null }))
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
          }
        })
        .catch((err) => console.error("Session check error:", err));
    }
  }, [initialUser]);

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

  const handleSwitchUser = async (role: "ADMIN" | "EMPLOYEE") => {
    const demoEmail =
      role === "ADMIN" ? "alex@lynkdigital.com" : "sarah.chen@lynkdigital.com";

    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: demoEmail,
          password: "password123",
          isDemoBypass: true,
        }),
      });
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error("Switch error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex">
      {/* Fixed Sidebar */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopNavbar
          currentUser={currentUser}
          title={title}
          subtitle={subtitle}
          onSwitchUser={handleSwitchUser}
          onOpenNewClientModal={onOpenNewClientModal}
          onOpenLeaveModal={onOpenLeaveModal}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
