"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Phone, Settings, Home, Plane,
  ShieldCheck, Bot, Languages, Wrench, ChevronDown, ChevronRight, LogOut,
  AlertTriangle, Users, BookOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect } from "react";

const mainNav = [
  { href: "/dashboard",   label: "Overview",    icon: BarChart3 },
  { href: "/calls",       label: "Call Logs",   icon: Phone },
  { href: "/escalations", label: "Escalations", icon: AlertTriangle },
  { href: "/team",        label: "Team",        icon: Users },
  { href: "/settings",    label: "Settings",    icon: Settings },
];

const adminNav = [
  { href: "/admin",            label: "Analytics",   icon: BarChart3 },
  { href: "/admin/agents",     label: "Agent Config", icon: Bot },
  { href: "/admin/knowledge",  label: "Knowledge Base", icon: BookOpen },
  { href: "/admin/languages",  label: "Languages",   icon: Languages },
  { href: "/admin/tools",      label: "Connectors",  icon: Wrench },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isInAdmin = pathname.startsWith("/admin");
  const [adminOpen, setAdminOpen] = useState(isInAdmin);
  const [waitingEscalations, setWaitingEscalations] = useState(0);

  useEffect(() => {
    const fetch_ = () =>
      fetch("/api/backend/v1/admin/escalations?status=waiting")
        .then(r => r.ok ? r.json() : null)
        .then(d => d && setWaitingEscalations(d.total ?? 0))
        .catch(() => {});
    fetch_();
    const t = setInterval(fetch_, 10000);
    return () => clearInterval(t);
  }, []);

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-6 border-b border-brand-700">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-gold-400" />
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-brand-300 uppercase leading-tight">
                SSR-Airport Advanced<br />Assisting System
              </p>
              <span className="text-base font-black text-white tracking-tight leading-none">AASS</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {mainNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === href
                  ? "bg-brand-700 text-white font-medium"
                  : "text-brand-200 hover:bg-brand-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
              {href === "/escalations" && waitingEscalations > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {waitingEscalations}
                </span>
              )}
            </Link>
          ))}

          {/* Admin section */}
          <div className="pt-2">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isInAdmin
                  ? "bg-brand-700 text-white font-medium"
                  : "text-brand-200 hover:bg-brand-800 hover:text-white"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="flex-1 text-left">Admin</span>
              {adminOpen
                ? <ChevronDown className="w-3 h-3 opacity-60" />
                : <ChevronRight className="w-3 h-3 opacity-60" />
              }
            </button>

            {adminOpen && (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-brand-700 pl-3">
                {adminNav.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      "flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors",
                      pathname === href
                        ? "bg-brand-700 text-white font-medium"
                        : "text-brand-300 hover:bg-brand-800 hover:text-white"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-brand-700 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 text-brand-300 hover:text-white text-sm transition-colors px-1 py-1"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-brand-300 hover:text-red-300 text-sm transition-colors w-full px-1 py-1"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
