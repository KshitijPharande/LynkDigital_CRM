"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AddEmployeeModal } from "@/components/team/AddEmployeeModal";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Building2,
  Search,
  Sparkles,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.users) setUsers(data.users);

      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);
    } catch (err) {
      console.error("Error loading team:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const departments = [
    "All",
    "Social Media",
    "Design",
    "Video Production",
    "Content & Copy",
    "Client Services",
    "Executive Management",
  ];

  const filteredUsers = users.filter((u) => {
    const matchesDept =
      selectedDept === "All" ||
      u.department.toLowerCase().includes(selectedDept.toLowerCase());
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <AppShell
      title="Agency Team Directory"
      subtitle="Team member profiles, designations, contact details, and client assignments"
      currentUser={currentUser}
    >
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-dark-subtle absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team by name, role..."
              className="w-full bg-dark-card border border-dark-border text-xs rounded-xl pl-9 pr-3 py-2 text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Add Team Member Button */}
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedDept === dept
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-dark-card border border-dark-border text-dark-muted hover:text-white hover:border-dark-borderLight"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Team Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="glass-panel p-5 rounded-2xl border border-dark-border animate-pulse h-48"
              />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-dark-border">
            <Users className="w-8 h-8 text-dark-subtle mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No team members found</p>
            <p className="text-xs text-dark-muted mt-1">
              Try adjusting your search query or department filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((user) => {
              const isUserAdmin = user.role === "ADMIN";
              const assignedClients = user.clientAssignments || [];

              return (
                <div
                  key={user.id}
                  className="glass-panel glass-panel-hover p-5 rounded-2xl border border-dark-border flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Avatar, Name, Role */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-sm ${
                            isUserAdmin
                              ? "bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-glow"
                              : "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-glowEmerald"
                          }`}
                        >
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-sm text-white">
                              {user.name}
                            </h4>
                          </div>
                          <p className="text-xs text-brand-400 font-medium">
                            {user.designation}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          isUserAdmin
                            ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                            : "bg-dark-border text-dark-muted"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>

                    {/* Department & Contact Info */}
                    <div className="space-y-1.5 text-xs text-dark-muted pt-2 border-t border-dark-border/60">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-dark-subtle shrink-0" />
                        <span className="text-gray-300">{user.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-dark-subtle shrink-0" />
                        <a
                          href={`mailto:${user.email}`}
                          className="text-dark-muted hover:text-brand-300 transition-colors truncate"
                        >
                          {user.email}
                        </a>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-dark-subtle shrink-0" />
                          <span className="text-gray-300">{user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Client Accounts */}
                    <div className="pt-2 border-t border-dark-border/60">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-dark-subtle mb-1.5">
                        Assigned Client Accounts ({assignedClients.length})
                      </p>
                      {assignedClients.length === 0 ? (
                        <p className="text-[11px] text-dark-muted italic">
                          No active client assignments
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedClients.map((assignment: any) => (
                            <Link
                              key={assignment.id}
                              href={`/clients/${assignment.client.id}`}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-dark-bg border border-dark-border text-gray-300 hover:text-brand-400 hover:border-brand-500/30 transition-all flex items-center gap-1"
                            >
                              <Building2 className="w-2.5 h-2.5 opacity-60" />
                              <span>{assignment.client.brandName}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Joined Date */}
                  <div className="pt-3 mt-3 border-t border-dark-border/40 flex items-center justify-between text-[11px] text-dark-subtle">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {formatDate(user.joiningDate)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        user.status === "ACTIVE"
                          ? "text-emerald-400"
                          : "text-dark-subtle"
                      }`}
                    >
                      ● {user.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTeam}
      />
    </AppShell>
  );
}
