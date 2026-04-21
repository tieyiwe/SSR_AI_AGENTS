"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Phone, Settings, Home, Plane,
  ShieldCheck, Bot, Languages, Wrench, ChevronDown, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/calls", label: "Call Logs", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { href: "/admin", label: "Analytics", icon: BarChart3 },
  { href: "/admin/agents", label: "Agent Config", icon: Bot },
  { href: "/admin/languages", label: "Languages", icon: Languages },
  { href: "/admin/tools", label: "Connectors", icon: Wrench },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInAdmin = pathname.startsWith("/admin");
  const [adminOpen, setAdminOpen] = useState(isInAdmin);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-6 border-b border-brand-700">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-gold-400" />
            <div>
              <h1 className="font-bold text-sm">SSR Airport AI</h1>
              <p className="text-brand-200 text-xs">Operations Center</p>
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
              {label}
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

        <div className="p-4 border-t border-brand-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-brand-300 hover:text-white text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
