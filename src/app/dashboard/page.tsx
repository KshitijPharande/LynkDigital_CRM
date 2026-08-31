import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import {
  Building2,
  CalendarDays,
  PlaneTakeoff,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Users,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  // Fetch real data from database
  const [
    totalClients,
    activeClients,
    totalCalendars,
    totalTeamCount,
    pendingLeavesCount,
    announcements,
    clientsList,
    pendingLeavesList,
    userAssignedClients,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.contentCalendar.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.announcement.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 2,
      include: { author: true },
    }),
    prisma.client.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        accountManager: true,
        contentCalendars: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    currentUser
      ? prisma.clientAssignment.findMany({
          where: { userId: currentUser.id },
          include: {
            client: {
              include: {
                contentCalendars: {
                  take: 1,
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const adminKpis = [
    {
      label: "Active Clients",
      value: activeClients,
      subtext: `${totalClients} Total accounts in roster`,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Content Calendars",
      value: totalCalendars,
      subtext: "Tracked Google Sheets",
      icon: CalendarDays,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Active Team Members",
      value: totalTeamCount,
      subtext: "Design, SMM & Video leads",
      icon: Users,
      color: "text-brand-400",
      bg: "bg-brand-500/10",
      border: "border-brand-500/20",
    },
    {
      label: "Pending Leaves",
      value: pendingLeavesCount,
      subtext: `${pendingLeavesCount} Requests need review`,
      icon: PlaneTakeoff,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  const employeeKpis = [
    {
      label: "My Assigned Clients",
      value: userAssignedClients.length,
      subtext: "Accounts in your workflow",
      icon: Building2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Content Calendars",
      value: totalCalendars,
      subtext: "Active Google Sheets directory",
      icon: CalendarDays,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Team Directory",
      value: totalTeamCount,
      subtext: "Agency colleagues",
      icon: Users,
      color: "text-brand-400",
      bg: "bg-brand-500/10",
      border: "border-brand-500/20",
    },
    {
      label: "Leave Applications",
      value: pendingLeavesCount,
      subtext: "Pending HR processing",
      icon: PlaneTakeoff,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <AppShell
      title={isAdmin ? "Agency Command Center" : `Welcome back, ${currentUser?.name || "Team Member"}`}
      subtitle={
        isAdmin
          ? "Operational overview, active client accounts, and Google Workspace assets"
          : `Personalized Hub • ${currentUser?.designation || "Creative Team"}`
      }
      currentUser={currentUser}
    >
      <div className="space-y-8">
        {/* Latest Announcement Alert */}
        {announcements.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-dark-card to-dark-card flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 mt-0.5 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                    Latest Announcement
                  </span>
                  <span className="text-xs text-dark-muted">
                    by {announcements[0].author?.name}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mt-1">
                  {announcements[0].title}
                </h4>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                  {announcements[0].content}
                </p>
              </div>
            </div>
            <Link
              href="/announcements"
              className="text-xs text-brand-400 hover:text-brand-300 whitespace-nowrap font-medium flex items-center gap-1 shrink-0 pt-1"
            >
              Noticeboard <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(isAdmin ? adminKpis : employeeKpis).map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div
                key={index}
                className="glass-panel glass-panel-hover p-5 rounded-2xl border border-dark-border"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-dark-muted">
                    {kpi.label}
                  </span>
                  <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.border} border`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tracking-tight">
                    {kpi.value}
                  </span>
                </div>
                <p className="text-[11px] text-dark-muted mt-1">{kpi.subtext}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Clients / My Assigned Accounts */}
          <div className="lg:col-span-2 glass-panel rounded-2xl border border-dark-border p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-400" />
                  {isAdmin ? "Active Agency Clients & Assets" : "My Assigned Client Accounts"}
                </h3>
                <p className="text-xs text-dark-muted">
                  Instant access to Google Sheet content calendars and master Drive folders
                </p>
              </div>
              <Link
                href="/clients"
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {(isAdmin
                ? clientsList
                : userAssignedClients.map((a) => a.client)
              ).length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-dark-bg/50 border border-dark-border">
                  <Building2 className="w-6 h-6 text-dark-subtle mx-auto mb-2" />
                  <p className="text-xs text-dark-muted">No client accounts yet. Create your first client profile.</p>
                </div>
              ) : (
                (isAdmin
                  ? clientsList
                  : userAssignedClients.map((a) => a.client)
                ).map((client) => {
                  const latestCalendar = client.contentCalendars?.[0];
                  return (
                    <div
                      key={client.id}
                      className="p-4 rounded-xl bg-dark-bg/60 border border-dark-border/80 hover:border-dark-borderLight transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-semibold text-sm text-white hover:text-brand-400 transition-colors flex items-center gap-1.5"
                          >
                            {client.brandName}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                          </Link>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              client.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {client.status}
                          </span>
                        </div>
                        <p className="text-xs text-dark-muted">
                          {client.industry} • Contact:{" "}
                          <span className="text-gray-300 font-medium">
                            {client.contactPerson}
                          </span>
                        </p>
                      </div>

                      {/* Google Workspace Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {latestCalendar?.googleSheetUrl && (
                          <a
                            href={latestCalendar.googleSheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>Sheet</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        )}
                        {client.googleDriveFolder && (
                          <a
                            href={client.googleDriveFolder}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <span>Drive</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions & Pending Leave Review Queue */}
          <div className="space-y-6">
            {/* Quick Navigation Hub */}
            <div className="glass-panel p-6 rounded-2xl border border-dark-border space-y-3">
              <h3 className="text-sm font-semibold text-white tracking-tight mb-2">
                Quick Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/clients"
                  className="p-3 rounded-xl bg-dark-bg/60 hover:bg-dark-border/40 border border-dark-border text-center group transition-all"
                >
                  <Building2 className="w-5 h-5 text-brand-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-white">Clients</p>
                  <p className="text-[10px] text-dark-muted">Roster & Drive</p>
                </Link>

                <Link
                  href="/calendars"
                  className="p-3 rounded-xl bg-dark-bg/60 hover:bg-dark-border/40 border border-dark-border text-center group transition-all"
                >
                  <CalendarDays className="w-5 h-5 text-emerald-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-white">Calendars</p>
                  <p className="text-[10px] text-dark-muted">Google Sheets</p>
                </Link>

                <Link
                  href="/team"
                  className="p-3 rounded-xl bg-dark-bg/60 hover:bg-dark-border/40 border border-dark-border text-center group transition-all"
                >
                  <Users className="w-5 h-5 text-violet-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-white">Team</p>
                  <p className="text-[10px] text-dark-muted">Directory</p>
                </Link>

                <Link
                  href="/announcements"
                  className="p-3 rounded-xl bg-dark-bg/60 hover:bg-dark-border/40 border border-dark-border text-center group transition-all"
                >
                  <Megaphone className="w-5 h-5 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-white">Noticeboard</p>
                  <p className="text-[10px] text-dark-muted">Company news</p>
                </Link>
              </div>
            </div>

            {/* Pending Leave Requests for Admin */}
            {isAdmin && (
              <div className="glass-panel rounded-2xl border border-violet-500/20 p-5 bg-gradient-to-b from-violet-500/5 to-transparent">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <PlaneTakeoff className="w-4 h-4 text-violet-400" />
                    Leave Review Queue
                  </h3>
                  <Link
                    href="/leaves"
                    className="text-xs text-violet-400 hover:underline font-medium"
                  >
                    Manage
                  </Link>
                </div>

                {pendingLeavesList.length === 0 ? (
                  <p className="text-xs text-dark-muted italic py-2">No pending leave applications</p>
                ) : (
                  <div className="space-y-2">
                    {pendingLeavesList.map((leave) => (
                      <div
                        key={leave.id}
                        className="p-3 rounded-xl bg-dark-bg/70 border border-dark-border/80 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {leave.user.name}
                          </p>
                          <p className="text-[10px] text-dark-muted">
                            {leave.leaveType} • {leave.daysCount} day(s) from{" "}
                            {formatDate(leave.startDate)}
                          </p>
                        </div>
                        <Link
                          href="/leaves"
                          className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-semibold"
                        >
                          Review
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
