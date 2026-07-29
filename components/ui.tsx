import clsx from "clsx";
import type { AlertLevel, DifficultyLevel } from "@/lib/types";

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-pine">{eyebrow}</p>}
        <h1 className="break-words text-2xl font-semibold leading-tight text-ink sm:text-3xl lg:text-4xl">{title}</h1>
      </div>
      {children && <div className="w-full md:w-auto">{children}</div>}
    </header>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-paper/95 p-3 shadow-soft sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 break-words text-lg font-semibold leading-snug text-ink">{title}</h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-sky-100 text-sky-700"
  };
  return <span className={clsx("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold leading-tight", tones[tone])}>{children}</span>;
}

export function alertLabel(alert: AlertLevel) {
  return alert.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function alertTone(alert: AlertLevel): "slate" | "green" | "amber" | "red" | "blue" {
  if (alert === "QUICK_WIN") return "green";
  if (alert === "OVERDUE" || alert === "DUE_SOON") return "red";
  if (alert === "MAJOR_DEADLINE" || alert === "START_SOON") return "amber";
  return "blue";
}

export function difficultyTone(level: DifficultyLevel): "slate" | "green" | "amber" | "red" | "blue" {
  if (level === "EASY") return "green";
  if (level === "MEDIUM") return "blue";
  if (level === "HARD") return "amber";
  return "red";
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-pine" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
