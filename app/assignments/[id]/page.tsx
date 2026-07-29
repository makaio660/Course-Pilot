import { notFound } from "next/navigation";
import { AssignmentWorkspace } from "@/components/AssignmentWorkspace";
import { Badge, PageHeader, Section, alertLabel, alertTone, difficultyTone } from "@/components/ui";
import { getAssignment, getCourse } from "@/lib/data";
import { assignmentGroups, syllabusEvents, taskPlans } from "@/lib/mockData";
import { formatShortDate } from "@/lib/dateUtils";

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assignment = getAssignment(id);
  if (!assignment) notFound();
  const course = getCourse(assignment.courseId)!;
  const group = assignmentGroups.find((item) => item.id === assignment.assignmentGroupId)!;
  const plans = taskPlans.filter((plan) => plan.assignmentId === assignment.id);
  const notes = syllabusEvents.filter((event) => event.courseId === assignment.courseId);
  const requirementNotes = notes.map((note) => note.sourceText);

  return (
    <>
      <PageHeader title={assignment.name} eyebrow={`Assignment workspace · ${course.name}`}>
        <div className="flex flex-wrap gap-2"><Badge tone={alertTone(assignment.alertLevel)}>{alertLabel(assignment.alertLevel)}</Badge><Badge tone={difficultyTone(assignment.difficultyLevel)}>{assignment.difficultyLevel}</Badge></div>
      </PageHeader>
      <div className="mb-5">
        <AssignmentWorkspace assignment={assignment} course={course} plans={plans} requirementNotes={requirementNotes} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Section title="Why this matters">
            <p className="text-slate-700">{assignment.description}</p>
            <p className="mt-3 text-slate-700">This assignment is marked {assignment.difficultyLevel.toLowerCase()} because {assignment.importanceReason.toLowerCase()} It likely takes {Math.round(assignment.estimatedMinutes / 60 * 10) / 10} hours.</p>
          </Section>
          <Section title="Priority reasons">
            <ul className="space-y-2 text-sm text-slate-700">
              {assignment.priorityReasons?.map((reason) => <li key={reason} className="rounded-lg bg-slate-50 p-3">{reason}</li>)}
            </ul>
          </Section>
          <Section title="Suggested work plan">
            <div className="space-y-3">
              {(plans.length ? plans : [{ id: "default", title: "Start focused work block", dueAt: assignment.dueAt, estimatedMinutes: Math.min(90, assignment.estimatedMinutes), generatedReason: "CoursePilot creates a starter block when no detailed milestone exists." }]).map((plan) => (
                <div key={plan.id} className="break-words rounded-lg border border-slate-200 p-3 text-sm"><strong>{formatShortDate(plan.dueAt)}:</strong> {plan.title} ({plan.estimatedMinutes} min). {plan.generatedReason}</div>
              ))}
            </div>
          </Section>
        </div>
        <div className="space-y-5">
          <Section title="Assignment details">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-slate-500">Due date</dt><dd className="font-medium">{formatShortDate(assignment.dueAt)}</dd></div>
              <div><dt className="text-slate-500">Points possible</dt><dd className="font-medium">{assignment.pointsPossible}</dd></div>
              <div><dt className="text-slate-500">Category</dt><dd className="font-medium">{group.name}{group.weight ? `, ${group.weight}%` : ""}</dd></div>
              <div><dt className="text-slate-500">Estimated time</dt><dd className="font-medium">{assignment.estimatedMinutes} minutes</dd></div>
              <div><dt className="text-slate-500">Priority score</dt><dd className="font-medium">{assignment.priorityScore}/100</dd></div>
              <div><dt className="text-slate-500">Completion status</dt><dd className="font-medium">{assignment.completionStatus.replace("_", " ")}</dd></div>
              <div><dt className="text-slate-500">Canvas link</dt><dd className="font-medium text-pine">Placeholder</dd></div>
            </dl>
          </Section>
          <Section title="Related syllabus notes">
            <div className="space-y-3">
              {notes.map((note) => <p key={note.id} className="rounded-lg bg-mist p-3 text-sm">{note.sourceText} <span className="font-semibold">Confidence: {note.confidence}</span></p>)}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
