import { CanvasWebsiteLinker } from "@/components/CanvasWebsiteLinker";
import { EmailReminderSettings } from "@/components/EmailReminderSettings";
import { PageHeader, Section } from "@/components/ui";
import { courses, submissions, user } from "@/lib/mockData";
import { enrichedAssignments } from "@/lib/data";
import { buildDigest } from "@/lib/digestBuilder";
import { automationSummary, buildEmailAutomations, recommendedDigestLeadLine } from "@/lib/emailAutomation";

export default function SettingsPage() {
  const daily = buildDigest(user, courses, enrichedAssignments, submissions, new Date("2026-01-20T12:00:00-08:00"), "DAILY");
  const weekly = buildDigest(user, courses, enrichedAssignments, submissions, new Date("2026-01-20T12:00:00-08:00"), "WEEKLY");
  const monthly = buildDigest(user, courses, enrichedAssignments, submissions, new Date("2026-01-20T12:00:00-08:00"), "MONTHLY");
  const automations = buildEmailAutomations(user);

  return (
    <>
      <PageHeader title="Settings" eyebrow="Digest and Canvas preferences" />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Section title="Preferences">
          <div className="grid gap-4">
            {["Daily digest", "Weekly digest", "Monthly digest", "Count missing past-due assignments as zero", "Ignore ungraded assignments"].map((label) => <label key={label} className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"><span className="min-w-0 text-sm sm:text-base">{label}</span><input className="shrink-0" type="checkbox" defaultChecked /></label>)}
            <label className="grid gap-1 text-sm">Preferred daily digest time<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={user.settings.digestTime} /></label>
            <label className="grid gap-1 text-sm">Preferred weekly digest day<select className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={user.settings.weeklyDigestDay}><option>Sunday</option><option>Monday</option></select></label>
            <label className="grid gap-1 text-sm">Preferred monthly digest day<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={user.settings.monthlyDigestDay} /></label>
            <label className="grid gap-1 text-sm">Alert sensitivity<select className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={user.settings.alertSensitivity}><option>low</option><option>normal</option><option>high</option></select></label>
            <label className="grid gap-1 text-sm">Minimum email importance threshold<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={user.settings.emailImportanceThreshold} /></label>
            <label className="grid gap-1 text-sm">Manual grade calculation preference<select className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={user.settings.gradeCalculationPreference}><option>canvas</option><option>syllabus</option><option>coursepilot</option></select></label>
          </div>
        </Section>
        <div className="space-y-5">
        <CanvasWebsiteLinker defaultCanvasBaseUrl={user.settings.canvasBaseUrl} />
        <EmailReminderSettings defaultEmail={user.email} weeklyDigest={weekly} monthlyDigest={monthly} />
        <Section title="Email automations">
          <div className="space-y-3">
            {automations.map((automation) => (
              <article key={automation.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{automation.digestType === "WEEKLY" ? "Weekly rundown" : "Monthly rundown"}</h3>
                    <p className="text-sm text-slate-600">{recommendedDigestLeadLine(automation.digestType)}</p>
                  </div>
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${automation.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{automation.enabled ? "Active" : "Paused"}</span>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <label className="grid gap-1">Send to<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={automation.recipientEmail} /></label>
                  <label className="grid gap-1">Subject<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={automation.subject} /></label>
                  <label className="grid gap-1">Schedule<input className="min-h-11 rounded-lg border border-slate-200 px-3 py-2" defaultValue={automationSummary(automation)} /></label>
                  <label className="flex min-h-11 items-center gap-2 rounded-lg bg-mist px-3 py-2"><input type="checkbox" defaultChecked={automation.enabled} /> Send automatically</label>
                </div>
              </article>
            ))}
          </div>
        </Section>
        <Section title="Email digest previews">
          {[daily, weekly, monthly].map((digest) => (
            <article key={digest.subject} className="mb-4 rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold">{digest.subject}</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {digest.sections.map((section) => <div key={section.title} className="rounded-lg bg-mist p-3 text-sm"><strong>{section.title}</strong><ul className="mt-2 list-disc pl-5">{(section.items.length ? section.items : ["Nothing pressing."]).slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul></div>)}
              </div>
            </article>
          ))}
        </Section>
        </div>
      </div>
    </>
  );
}
