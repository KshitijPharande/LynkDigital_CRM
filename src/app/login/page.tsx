"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Palette,
  Video,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      name: "Alex Morgan",
      role: "ADMIN",
      designation: "Managing Director (Admin)",
      email: "alex@lynkdigital.com",
      icon: Shield,
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      name: "Sarah Chen",
      role: "EMPLOYEE",
      designation: "Lead Social Media Strategist",
      email: "sarah.chen@lynkdigital.com",
      icon: Sparkles,
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      name: "David Kim",
      role: "EMPLOYEE",
      designation: "Senior Graphic Designer",
      email: "david.kim@lynkdigital.com",
      icon: Palette,
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      name: "Liam Rossi",
      role: "EMPLOYEE",
      designation: "Video Editor & Motion Lead",
      email: "liam.rossi@lynkdigital.com",
      icon: Video,
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  ];

  const handleLogin = async (
    targetEmail?: string,
    targetPassword?: string,
    isDemo: boolean = false
  ) => {
    setError(null);
    setLoading(true);

    const loginEmail = targetEmail || email;
    const loginPassword = targetPassword || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          isDemoBypass: isDemo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/15 via-accent-cyan/10 to-purple-600/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan shadow-glow mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to <span className="gradient-text-blue">LynkDigital CRM</span>
          </h1>
          <p className="text-xs text-dark-muted">
            Internal operations, client content calendars, and approval hub
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-border shadow-glass space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-dark-subtle absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lynkdigital.com"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-300">
                  Password
                </label>
                <span className="text-[10px] text-dark-subtle">
                  Default: <code className="text-brand-400">password123</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-dark-subtle absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-dark-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-dark-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-dark-muted uppercase tracking-wider">
                1-Click Quick Demo Login
              </span>
              <span className="text-[10px] text-brand-400 font-medium">Instant Access</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.email}
                    onClick={() => handleLogin(account.email, "password123", true)}
                    disabled={loading}
                    className="w-full p-2.5 rounded-xl bg-dark-bg/80 border border-dark-border hover:border-brand-500/40 hover:bg-dark-card transition-all text-left flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-dark-card border border-dark-border text-gray-300 group-hover:text-brand-400 group-hover:border-brand-500/30 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">
                            {account.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${account.badgeColor}`}
                          >
                            {account.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-dark-muted">
                          {account.designation}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-dark-subtle group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <p className="text-center text-[11px] text-dark-subtle">
          LynkDigital CRM v1.0 • Protected by End-to-End JWT Session Security
        </p>
      </div>
    </div>
  );
}
