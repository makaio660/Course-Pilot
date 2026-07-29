"use client";

import { useEffect, useMemo, useState } from "react";
import { Maximize2, Minimize2, RotateCcw, TrendingDown, TrendingUp, X } from "lucide-react";
import type { Assignment, Course, TaskPlan } from "@/lib/types";
import { formatShortDate } from "@/lib/dateUtils";
import { Badge, ProgressBar, alertLabel, alertTone, difficultyTone } from "./ui";
import { useTaskControls } from "./useTaskControls";

type SizeMode = "compact" | "normal" | "expanded";

export function AssignmentWorkspace({
  assignment,
  course,
  plans,
  requirementNotes
}: {
  assignment: Assignment & { priorityReasons?: string[] };
  course: Course;
  plans: TaskPlan[];
  requirementNotes: string[];
}) {
  const controls = useTaskControls([assignment]);
  const managed = controls.managedAssignments[0] ?? assignment;
  const [draft, setDraft] = useState("");
  const [size, setSize] = useState<SizeMode>("compact");
  const storageKey = `coursepilot-draft-${assignment.id}`;

  useEffect(() => {
    setDraft(window.localStorage.getItem(storageKey) ?? "");
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, draft);
  }, [draft, storageKey]);

  const outline = useMemo(() => {
    const milestones = plans.map((plan) => `- ${plan.title} (${formatShortDate(plan.dueAt)})`).join("\n");
    return [
      `${assignment.name} Outline`,
      "",
      "Thesis / main goal:",
      "- ",
      "",
      "Requirements to cover:",
      `- ${assignment.description}`,
      `- ${assignment.importanceReason}`,
      ...requirementNotes.map((note) => `- ${note}`),
      "",
      "Work plan:",
      milestones || "- Draft the main idea\n- Add evidence or examples\n- Revise against the requirements",
      "",
      "Rough draft:",
      ""
    ].join("\n");
  }, [assignment, plans, requirementNotes]);

  const heightClass = size === "compact" ? "h-52 sm:h-56" : size === "expanded" ? "h-[34rem]" : "h-80";

  return (
    <section className="rounded-lg border border-slate-200 bg-white/92 p-3 shadow-soft sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">Assignment draft</h2>
          <p className="text-sm text-slate-600">{course.name} · saved locally on this device</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setSize("compact")} className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-600 sm:h-9 sm:w-9" title="Shrink draft">
            <Minimize2 size={17} />
          </button>
          <button type="button" onClick={() => setSize("normal")} className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 sm:h-9 sm:w-9" title="Normal draft size">
            1x
          </button>
          <button type="button" onClick={() => setSize(size === "expanded" ? "normal" : "expanded")} className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-600 sm:h-9 sm:w-9" title="Expand draft">
            <Maximize2 size={17} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button type="button" onClick={() => setDraft((value) => value.trim() ? value : outline)} className="min-h-11 rounded-lg bg-pine px-3 py-2 text-sm font-semibold text-white">Start outline</button>
            <button type="button" onClick={() => setDraft("")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <RotateCcw size={16} /> Clear draft
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={`${heightClass} w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-6 text-ink outline-none transition focus:border-pine focus:bg-white sm:p-4`}
            placeholder="Start a rough outline or draft here..."
          />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg bg-mist p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge tone={alertTone(managed.alertLevel)}>{alertLabel(managed.alertLevel)}</Badge>
              <Badge tone={difficultyTone(managed.difficultyLevel)}>{managed.difficultyLevel}</Badge>
            </div>
            <p className="text-sm text-slate-700">{assignment.description}</p>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Priority {managed.userPriorityOverride !== undefined ? "(edited)" : ""}</span>
              <span>{managed.priorityScore}/100</span>
            </div>
            <ProgressBar value={managed.priorityScore} />
            <div className="mt-3 grid grid-cols-3 gap-2">
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
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold text-ink">Requirements</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>{assignment.importanceReason}</li>
              <li>{assignment.pointsPossible} points · due {formatShortDate(assignment.dueAt)}</li>
              <li>Estimated work time: {Math.round(assignment.estimatedMinutes / 60 * 10) / 10} hours</li>
              {requirementNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
