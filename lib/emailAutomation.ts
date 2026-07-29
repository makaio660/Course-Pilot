import { addDays, formatShortDate } from "./dateUtils";
import type { DigestType, User } from "./types";

export type EmailAutomation = {
  id: string;
  digestType: Extract<DigestType, "WEEKLY" | "MONTHLY">;
  enabled: boolean;
  recipientEmail: string;
  sendTime: string;
  sendDayLabel: string;
  nextRunAt: string;
  subject: string;
};

export function buildEmailAutomations(user: User, now = new Date("2026-01-20T12:00:00-08:00")): EmailAutomation[] {
  const weeklyRun = nextWeeklyRun(now, user.settings.weeklyDigestDay, user.settings.digestTime);
  const monthlyRun = nextMonthlyRun(now, user.settings.monthlyDigestDay, user.settings.digestTime);

  return [
    {
      id: "weekly-coursepilot-rundown",
      digestType: "WEEKLY",
      enabled: user.settings.weeklyDigestEnabled,
      recipientEmail: user.email,
      sendTime: user.settings.digestTime,
      sendDayLabel: user.settings.weeklyDigestDay,
      nextRunAt: weeklyRun,
      subject: "Your week ahead: what matters most"
    },
    {
      id: "monthly-coursepilot-rundown",
      digestType: "MONTHLY",
      enabled: user.settings.monthlyDigestEnabled,
      recipientEmail: user.email,
      sendTime: user.settings.digestTime,
      sendDayLabel: `Day ${user.settings.monthlyDigestDay}`,
      nextRunAt: monthlyRun,
      subject: "Your month ahead: exams, papers, and big deadlines"
    }
  ];
}

export function automationSummary(automation: EmailAutomation) {
  return `${automation.enabled ? "Active" : "Paused"} · ${automation.sendDayLabel} at ${automation.sendTime} · next send ${formatShortDate(automation.nextRunAt)}`;
}

function nextWeeklyRun(now: Date, dayName: string, time: string) {
  const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(dayName);
  const target = new Date(now);
  const daysAhead = (dayIndex - now.getDay() + 7) % 7 || 7;
  target.setDate(now.getDate() + daysAhead);
  applyTime(target, time);
  return target.toISOString();
}

function nextMonthlyRun(now: Date, dayOfMonth: number, time: string) {
  const target = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  applyTime(target, time);
  if (target <= now) target.setMonth(target.getMonth() + 1);
  return target.toISOString();
}

function applyTime(date: Date, time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
}

export function recommendedDigestLeadLine(type: EmailAutomation["digestType"]) {
  if (type === "WEEKLY") return "Sends upcoming work, grade risks, quick wins, and suggested study blocks for the next 7-14 days.";
  return "Sends major exams, papers, projects, recommended start dates, and long-term grade risks for the next month.";
}
