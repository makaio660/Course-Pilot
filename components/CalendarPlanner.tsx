"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Filter, Flag, ListChecks, RotateCcw, Search, Sparkles, Trash2, TrendingDown, TrendingUp, Undo2 } from "lucide-react";
import { addDays, daysBetween, formatShortDate } from "@/lib/dateUtils";
import type { Assignment, Course, TaskPlan } from "@/lib/types";
import { Badge, alertLabel, alertTone } from "./ui";
import { useTaskControls } from "./useTaskControls";

type CalendarEvent = {
  id: string;
  assignmentId: string;
  title: string;
  courseId: string;
  date: string;
  kind: "due" | "start" | "milestone";
  assignmentType: string;
  isMajor: boolean;
  alertLevel: Assignment["alertLevel"];
  priorityScore: number;
  detail: string;
};

export function CalendarPlanner({
  assignments,
  courses,
  taskPlans,
  currentDate
}: {
  assignments: Assignment[];
  courses: Course[];
  taskPlans: TaskPlan[];
  currentDate: string;
}) {
  const [view, setView] = useState<"week" | "month" | "major">("week");
  const [courseId, setCourseId] = useState("all");
  const [assignmentType, setAssignmentType] = useState("all");
  const [query, setQuery] = useState("");
  const today = useMemo(() => new Date(currentDate), [currentDate]);
  const controls = useTaskControls(assignments);
  const managedAssignments = controls.managedAssignments;

  const events = useMemo(() => {
    const dueEvents: CalendarEvent[] = managedAssignments.map((assignment) => ({
      id: `due-${assignment.id}`,
      assignmentId: assignment.id,
      title: assignment.name,
      courseId: assignment.courseId,
      date: assignment.dueAt,
      kind: "due",
      assignmentType: assignment.assignmentType,
      isMajor: assignment.isMajor,
      alertLevel: assignment.alertLevel,
      priorityScore: assignment.priorityScore,
      detail: `${assignment.pointsPossible} pts · ${assignment.difficultyLevel} · ${Math.round(assignment.estimatedMinutes / 60 * 10) / 10}h`
    }));

    const startEvents: CalendarEvent[] = managedAssignments
      .filter((assignment) => assignment.isMajor || assignment.difficultyLevel === "HARD" || assignment.difficultyLevel === "MAJOR")
      .map((assignment) => ({
        id: `start-${assignment.id}`,
        assignmentId: assignment.id,
        title: `Start ${assignment.name}`,
        courseId: assignment.courseId,
        date: addDays(assignment.dueAt, assignment.isMajor ? -21 : -7),
        kind: "start",
        assignmentType: assignment.assignmentType,
        isMajor: assignment.isMajor,
        alertLevel: assignment.alertLevel,
        priorityScore: assignment.priorityScore,
        detail: assignment.importanceReason
      }));

    const milestones: CalendarEvent[] = taskPlans.map((plan) => {
      const assignment = managedAssignments.find((item) => item.id === plan.assignmentId);
      if (!assignment) return undefined;
      return {
        id: `milestone-${plan.id}`,
        assignmentId: assignment.id,
        title: plan.title,
        courseId: assignment.courseId,
        date: plan.dueAt,
        kind: "milestone",
        assignmentType: assignment.assignmentType,
        isMajor: assignment.isMajor,
        alertLevel: assignment.alertLevel,
        priorityScore: assignment.priorityScore,
        detail: `${plan.estimatedMinutes} min · ${plan.generatedReason}`
      };
    }).filter(Boolean) as CalendarEvent[];

    return [...dueEvents, ...startEvents, ...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [managedAssignments, taskPlans]);

  const filtered = events.filter((event) => {
    const days = daysBetween(today, new Date(event.date));
    const viewMatch = view === "week" ? days >= 0 && days <= 14 : view === "month" ? days >= 0 && days <= 45 : event.isMajor;
    const courseMatch = courseId === "all" || event.courseId === courseId;
    const typeMatch = assignmentType === "all" || event.assignmentType === assignmentType;
    const textMatch = event.title.toLowerCase().includes(query.toLowerCase());
    return viewMatch && courseMatch && typeMatch && textMatch;
  });

  const majorStarts = filtered.filter((event) => event.kind === "start" && event.isMajor).slice(0, 4);
  const nextDue = filtered.filter((event) => event.kind === "due").slice(0, 6);
  const topPlan = managedAssignments.filter((assignment) => assignment.completionStatus !== "done").sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
  const types = [...new Set(assignments.map((assignment) => assignment.assignmentType))].sort();

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white/92 p-3 shadow-soft sm:p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <CalendarDays size={18} className="text-pine" />
              Planning calendar
            </div>
            <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 sm:w-auto sm:gap-2">
              {(["week", "month", "major"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setView(item)} className={`min-h-11 rounded-md px-2 py-2 text-xs font-semibold capitalize transition sm:px-3 sm:text-sm ${view === item ? "bg-pine text-white" : "text-slate-600 hover:bg-white"}`}>
                  {item === "major" ? "Major only" : item}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button type="button" onClick={controls.undo} disabled={!controls.canUndo} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45">
              <Undo2 size={16} /> Undo
            </button>
            <button type="button" onClick={controls.reset} disabled={!controls.hasChanges} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45">
              <RotateCcw size={16} /> Reset
            </button>
            {controls.hiddenCount > 0 && <span className="col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-900 sm:col-span-1">{controls.hiddenCount} hidden</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem]">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" placeholder="Search calendar" />
            </label>
            <label className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm">
                <option value="all">All courses</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.courseCode}</option>)}
              </select>
            </label>
            <select value={assignmentType} onChange={(event) => setAssignmentType(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2 lg:col-span-1">
              <option value="all">All types</option>
              {types.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3">
          {filtered.map((event) => {
            const course = courses.find((item) => item.id === event.courseId);
            return (
              <article key={event.id} className="group relative grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-soft sm:p-4 md:grid-cols-[5rem_1fr_auto] md:items-center">
                <button type="button" onClick={() => controls.deleteTask(event.assignmentId)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-700 opacity-100 transition sm:h-8 sm:w-8 sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100" title="Delete task">
                  <Trash2 size={15} />
                </button>
                <div>
                  <p className="text-sm font-bold text-ink">{formatShortDate(event.date)}</p>
                  <p className="text-xs text-slate-500">{daysBetween(today, new Date(event.date)) === 0 ? "Today" : `${daysBetween(today, new Date(event.date))} days`}</p>
                </div>
                <div className="min-w-0 pr-9">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-semibold leading-snug text-ink">{event.title}</h2>
                    <Badge tone={event.kind === "due" ? alertTone(event.alertLevel) : event.kind === "start" ? "amber" : "green"}>
                      {event.kind === "due" ? alertLabel(event.alertLevel) : event.kind === "start" ? "Suggested Start" : "Milestone"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{course?.name} · {event.detail}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs font-semibold text-slate-500">Priority</p>
                  <p className="text-lg font-bold text-pine">{event.priorityScore}/100</p>
                  <div className="mt-2 grid max-w-28 grid-cols-2 gap-2 md:ml-auto">
                    <button type="button" onClick={() => controls.upgradePriority(event.assignmentId)} className="grid h-10 place-items-center rounded-md bg-emerald-50 text-emerald-700 sm:h-8" title="Upgrade priority">
                      <TrendingUp size={15} />
                    </button>
                    <button type="button" onClick={() => controls.downgradePriority(event.assignmentId)} className="grid h-10 place-items-center rounded-md bg-sky-50 text-sky-700 sm:h-8" title="Downgrade priority">
                      <TrendingDown size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white/92 p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-pine" />
            <h2 className="font-semibold">Best next moves</h2>
          </div>
          <div className="space-y-3">
            {topPlan.map((assignment) => (
              <div key={assignment.id} className="rounded-lg bg-mist p-3">
                <p className="font-semibold">{assignment.name}</p>
                <p className="text-sm text-slate-600">{assignment.importanceReason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white/92 p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Flag size={18} className="text-amber-600" />
            <h2 className="font-semibold">Major start dates</h2>
          </div>
          <div className="space-y-2">
            {(majorStarts.length ? majorStarts : events.filter((event) => event.kind === "start" && event.isMajor).slice(0, 4)).map((event) => (
              <p key={event.id} className="rounded-lg bg-amber-50 p-3 text-sm"><strong>{formatShortDate(event.date)}:</strong> {event.title}</p>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white/92 p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks size={18} className="text-pine" />
            <h2 className="font-semibold">Due soon</h2>
          </div>
          <div className="space-y-2">
            {nextDue.map((event) => <p key={event.id} className="text-sm text-slate-700"><strong>{formatShortDate(event.date)}</strong> · {event.title}</p>)}
          </div>
        </div>
      </aside>
    </div>
  );
}
