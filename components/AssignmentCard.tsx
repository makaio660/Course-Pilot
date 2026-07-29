import Link from "next/link";
import { Clock, Target } from "lucide-react";
import { getCourse } from "@/lib/data";
import type { Assignment } from "@/lib/types";
import { alertLabel, alertTone, Badge, difficultyTone, ProgressBar } from "./ui";
import { formatShortDate } from "@/lib/dateUtils";

export function AssignmentCard({ assignment, compact = false }: { assignment: Assignment & { priorityReasons?: string[] }; compact?: boolean }) {
  const course = getCourse(assignment.courseId);
  return (
    <Link href={`/assignments/${assignment.id}`} className="block rounded-lg border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-soft sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{course?.name}</p>
          <h3 className="break-words font-semibold leading-snug text-ink">{assignment.name}</h3>
        </div>
        <Badge tone={alertTone(assignment.alertLevel)}>{alertLabel(assignment.alertLevel)}</Badge>
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-600">
        <Badge tone={difficultyTone(assignment.difficultyLevel)}>{assignment.difficultyLevel}</Badge>
        <span className="inline-flex items-center gap-1"><Clock size={14} className="shrink-0" /> {Math.round(assignment.estimatedMinutes / 60 * 10) / 10}h</span>
        <span>Due {formatShortDate(assignment.dueAt)}</span>
        <span>{assignment.pointsPossible} pts</span>
      </div>
      {!compact && <p className="mb-3 text-sm text-slate-600">{assignment.priorityReasons?.[1] ?? assignment.importanceReason}</p>}
      <div className="flex items-center gap-3">
        <Target size={15} className="shrink-0 text-pine" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Priority</span><span>{assignment.priorityScore}/100</span></div>
          <ProgressBar value={assignment.priorityScore} />
        </div>
      </div>
    </Link>
  );
}
