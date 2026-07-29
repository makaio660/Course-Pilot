"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Save, Send } from "lucide-react";
import type { DigestSection } from "@/lib/types";

type DigestPreview = {
  subject: string;
  sections: DigestSection[];
  plainTextBody: string;
};

export function EmailReminderSettings({
  defaultEmail,
  weeklyDigest,
  monthlyDigest
}: {
  defaultEmail: string;
  weeklyDigest: DigestPreview;
  monthlyDigest: DigestPreview;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);
  const [monthlyEnabled, setMonthlyEnabled] = useState(true);
  const [weeklyDay, setWeeklyDay] = useState("Sunday");
  const [sendTime, setSendTime] = useState("7:30 AM");
  const [monthlyDay, setMonthlyDay] = useState("1");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("coursepilot-email-reminders");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setEmail(parsed.email ?? defaultEmail);
    setWeeklyEnabled(parsed.weeklyEnabled ?? true);
    setMonthlyEnabled(parsed.monthlyEnabled ?? true);
    setWeeklyDay(parsed.weeklyDay ?? "Sunday");
    setSendTime(parsed.sendTime ?? "7:30 AM");
    setMonthlyDay(parsed.monthlyDay ?? "1");
  }, [defaultEmail]);

  const scheduleSummary = useMemo(() => {
    const weekly = weeklyEnabled ? `Weekly on ${weeklyDay} at ${sendTime}` : "Weekly off";
    const monthly = monthlyEnabled ? `Monthly on day ${monthlyDay} at ${sendTime}` : "Monthly off";
    return `${weekly}. ${monthly}.`;
  }, [monthlyDay, monthlyEnabled, sendTime, weeklyDay, weeklyEnabled]);

  function save() {
    window.localStorage.setItem("coursepilot-email-reminders", JSON.stringify({
      email,
      weeklyEnabled,
      monthlyEnabled,
      weeklyDay,
      sendTime,
      monthlyDay
    }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function mailtoFor(digest: DigestPreview) {
    const body = [
      digest.plainTextBody,
      "",
      `Reminder settings: ${scheduleSummary}`
    ].join("\n");
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(digest.subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white/92 p-3 shadow-soft sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Mail size={18} className="shrink-0 text-pine" />
            <h2 className="text-lg font-semibold text-ink">Email reminders</h2>
          </div>
          <p className="text-sm text-slate-600">Send a rundown of what to do soon to the email address you choose.</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Weekly overview ready</span>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <label className="grid gap-1">Send reminders to<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" /></label>
        <label className="grid gap-1">Send time<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" value={sendTime} onChange={(event) => setSendTime(event.target.value)} /></label>
        <label className="flex min-h-11 items-center gap-2 rounded-lg bg-mist px-3 py-2"><input type="checkbox" checked={weeklyEnabled} onChange={(event) => setWeeklyEnabled(event.target.checked)} /> Weekly overview</label>
        <label className="grid gap-1">Weekly day<select className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" value={weeklyDay} onChange={(event) => setWeeklyDay(event.target.value)}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => <option key={day}>{day}</option>)}</select></label>
        <label className="flex min-h-11 items-center gap-2 rounded-lg bg-mist px-3 py-2"><input type="checkbox" checked={monthlyEnabled} onChange={(event) => setMonthlyEnabled(event.target.checked)} /> Monthly overview</label>
        <label className="grid gap-1">Monthly day<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" value={monthlyDay} onChange={(event) => setMonthlyDay(event.target.value)} /></label>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{scheduleSummary}</div>

      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <button type="button" onClick={save} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-pine px-3 py-2 text-sm font-semibold text-white">
          <Save size={16} /> Save reminder settings
        </button>
        <a href={mailtoFor(weeklyDigest)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <Send size={16} /> Open weekly email draft
        </a>
        <a href={mailtoFor(monthlyDigest)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <Send size={16} /> Open monthly email draft
        </a>
        {saved && <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Saved</span>}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {weeklyDigest.sections.slice(0, 4).map((section) => (
          <div key={section.title} className="rounded-lg border border-slate-200 p-3 text-sm">
            <strong>{section.title}</strong>
            <ul className="mt-2 list-disc pl-5 text-slate-600">
              {(section.items.length ? section.items : ["Nothing pressing."]).slice(0, 3).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
