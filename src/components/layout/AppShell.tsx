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
        .then((res) => {
          if (!res.ok) {
            router.push("/login");
            return { user: null };
          }
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            router.push("/login");
          }
        })
        .catch(() => router.push("/login"));
    }
  }, [initialUser, router]);

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
      {/* Fixed Left Sidebar */}
      <Sidebar currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Navbar */}
        <TopNavbar
          title={title}
          subtitle={subtitle}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenNewClientModal={onOpenNewClientModal}
          onOpenLeaveModal={onOpenLeaveModal}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
