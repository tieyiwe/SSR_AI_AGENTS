"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Phone, Settings, Home, Plane } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/calls", label: "Call Logs", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
          {navItems.map(({ href, label, icon: Icon }) => (
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
