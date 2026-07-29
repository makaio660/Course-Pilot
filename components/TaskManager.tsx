"use client";

import Link from "next/link";
import { RotateCcw, Search, Trash2, Undo2, TrendingDown, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Assignment, Course } from "@/lib/types";
import { formatShortDate } from "@/lib/dateUtils";
import { alertLabel, alertTone, Badge, difficultyTone, ProgressBar } from "./ui";
import { useTaskControls } from "./useTaskControls";

export function TaskManager({
  assignments,
  courses
}: {
  assignments: (Assignment & { priorityReasons?: string[] })[];
  courses: Course[];
}) {
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [mode, setMode] = useState("all");
  const controls = useTaskControls(assignments);

  const filtered = useMemo(() => {
    return controls.managedAssignments.filter((assignment) => {
      const courseMatch = courseId === "all" || assignment.courseId === courseId;
      const difficultyMatch = difficulty === "all" || assignment.difficultyLevel === difficulty;
      const textMatch = assignment.name.toLowerCase().includes(query.toLowerCase());
      const modeMatch =
        mode === "all" ||
        (mode === "major" && assignment.isMajor) ||
        (mode === "quick" && assignment.alertLevel === "QUICK_WIN") ||
        (mode === "not_started" && assignment.completionStatus === "not_started");
      return courseMatch && difficultyMatch && textMatch && modeMatch;
    });
  }, [controls.managedAssignments, courseId, difficulty, mode, query]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white/92 p-3 shadow-soft sm:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">Task controls</h2>
            <p className="text-sm text-slate-600">Upgrade, downgrade, delete, undo, or reset local task priorities.</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <button type="button" onClick={controls.undo} disabled={!controls.canUndo} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45">
              <Undo2 size={16} /> Undo
            </button>
            <button type="button" onClick={controls.reset} disabled={!controls.hasChanges} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45">
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_12rem]">
          <label className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" placeholder="Search assignments" />
          </label>
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All courses</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
            <option value="MAJOR">Major</option>
          </select>
          <select value={mode} onChange={(event) => setMode(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="all">All tasks</option>
            <option value="major">Major only</option>
            <option value="quick">Quick wins</option>
            <option value="not_started">Not started</option>
          </select>
        </div>
        {controls.hiddenCount > 0 && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <Trash2 size={15} /> {controls.hiddenCount} task{controls.hiddenCount === 1 ? "" : "s"} hidden. Use Reset to bring everything back.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((assignment) => {
          const course = courses.find((item) => item.id === assignment.courseId);
          return (
            <article key={assignment.id} className="group relative rounded-lg border border-slate-200 bg-white p-3 shadow-soft sm:p-4">
              <button type="button" onClick={() => controls.deleteTask(assignment.id)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-700 opacity-100 transition sm:h-8 sm:w-8 sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100" title="Delete task">
                <Trash2 size={16} />
              </button>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 pr-9">
                  <p className="text-xs font-semibold text-slate-500">{course?.name}</p>
                  <Link href={`/assignments/${assignment.id}`} className="break-words font-semibold leading-snug text-ink hover:text-pine">{assignment.name}</Link>
                </div>
                <div className="sm:pr-8"><Badge tone={alertTone(assignment.alertLevel)}>{alertLabel(assignment.alertLevel)}</Badge></div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <Badge tone={difficultyTone(assignment.difficultyLevel)}>{assignment.difficultyLevel}</Badge>
                <span>Due {formatShortDate(assignment.dueAt)}</span>
                <span>{assignment.pointsPossible} pts</span>
                <span>{Math.round(assignment.estimatedMinutes / 60 * 10) / 10}h</span>
              </div>
              <p className="mb-3 text-sm text-slate-600">{assignment.priorityReasons?.[1] ?? assignment.importanceReason}</p>
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Priority {assignment.userPriorityOverride !== undefined ? "(edited)" : ""}</span>
                  <span>{assignment.priorityScore}/100</span>
                </div>
                <ProgressBar value={assignment.priorityScore} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => controls.upgradePriority(assignment.id)} className="grid min-h-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700 sm:min-h-9" title="Upgrade priority">
                  <TrendingUp size={17} />
                </button>
                <button type="button" onClick={() => controls.downgradePriority(assignment.id)} className="grid min-h-11 place-items-center rounded-lg bg-sky-50 text-sky-700 sm:min-h-9" title="Downgrade priority">
                  <TrendingDown size={17} />
                </button>
                <button type="button" onClick={() => controls.clearPriority(assignment.id)} className="grid min-h-11 place-items-center rounded-lg bg-slate-100 text-slate-600 sm:min-h-9" title="Clear priority override">
                  <X size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
