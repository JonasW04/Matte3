"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Brain, ClipboardList, Database, GraduationCap, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";

type SidebarUser = {
  name: string;
  email: string;
  role: Role;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tema", label: "Temaer", icon: BookOpen },
  { href: "/adaptiv", label: "Adaptiv", icon: Brain },
  { href: "/eksamen", label: "Eksamen", icon: ClipboardList },
  { href: "/profil", label: "Profil", icon: UserRound }
];

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="border-b border-stone-200/80 bg-paper/95 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5 lg:py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-lg font-bold text-white">∑</div>
          <div className="leading-tight">
            <div className="font-semibold text-stone-950">Matte 3</div>
            <div className="text-xs font-medium uppercase tracking-wider text-stone-500">TMA4422 · NTNU</div>
          </div>
        </Link>
        <div className="lg:hidden">
          <GraduationCap className="h-5 w-5 text-ntnu" />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-stone-900/5 text-stone-950" : "text-stone-600 hover:bg-stone-900/[0.03] hover:text-stone-950"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        {user.role === "ADMIN" && (
          <Link
            href="/admin/import"
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin") ? "bg-stone-900/5 text-stone-950" : "text-stone-600 hover:bg-stone-900/[0.03] hover:text-stone-950"
            )}
          >
            <Database className="h-4 w-4" />
            Import
          </Link>
        )}
      </nav>

      <div className="hidden px-5 pt-8 lg:block">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            <BarChart3 className="h-4 w-4" />
            Studieplattform
          </div>
          <p className="text-sm leading-relaxed text-stone-600">
            Oppgaver fra gamle NTNU-eksamener sortert mot TMA4422-fremdriftsplanen.
          </p>
        </div>
      </div>

      <div className="mt-auto hidden border-t border-stone-200/80 p-4 lg:block">
        <Link href="/profil" className="mb-3 flex items-center gap-3 rounded-lg p-2 hover:bg-stone-900/[0.03]">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-stone-200 text-sm font-bold text-stone-700">{initials}</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-stone-900">{user.name}</div>
            <div className="truncate text-xs text-stone-500">{user.email}</div>
          </div>
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950">
            <LogOut className="h-4 w-4" />
            Logg ut
          </button>
        </form>
      </div>
    </aside>
  );
}
