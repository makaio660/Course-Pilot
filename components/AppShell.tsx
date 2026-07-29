"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ClipboardList, Gauge, GraduationCap, Settings, Sparkles } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/grades", label: "Grades", icon: GraduationCap },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 z-30 border-b border-slate-200 bg-paper/95 px-3 py-3 backdrop-blur lg:h-dvh lg:w-72 lg:border-b-0 lg:border-r lg:px-4 lg:py-4">
        <div className="mx-auto max-w-screen-2xl lg:mx-0">
          <Link href="/dashboard" className="mb-3 flex min-w-0 items-center gap-3 lg:mb-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-pine text-white"><Sparkles size={20} /></span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold">CoursePilot</span>
              <span className="hidden text-xs text-slate-500 sm:block lg:inline">Know what matters before it becomes urgent.</span>
            </span>
          </Link>
          <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={clsx("flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm lg:justify-start lg:px-3", active ? "bg-pine text-white shadow-soft" : "text-slate-600 hover:bg-mist")}>
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-3 pb-10 pt-5 sm:px-5 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
      </main>
    </div>
  );
}
