import { Badge, PageHeader, Section } from "@/components/ui";
import { assignmentGroups, courses, syllabusEvents } from "@/lib/mockData";
import { formatShortDate } from "@/lib/dateUtils";

export default function SyllabusPage() {
  return (
    <>
      <PageHeader title="Syllabus intelligence" eyebrow="Mock extraction results" />
      <div className="grid gap-5 lg:grid-cols-2">
        {courses.map((course) => (
          <Section key={course.id} title={course.name} action={<Badge tone={course.finalGradesHidden ? "amber" : "green"}>{course.gradingMode}</Badge>}>
            <div className="mb-4">
              <h3 className="mb-2 font-semibold">Grading weights</h3>
              <div className="flex flex-wrap gap-2">{assignmentGroups.filter((group) => group.courseId === course.id).map((group) => <Badge key={group.id} tone="blue">{group.name}: {group.weight ? `${group.weight}%` : "points"}</Badge>)}</div>
            </div>
            <div className="space-y-3">
              {syllabusEvents.filter((event) => event.courseId === course.id).map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-3"><strong className="min-w-0 break-words">{event.title}</strong><Badge tone={event.confidence === "HIGH" ? "green" : "amber"}>{event.confidence}</Badge></div>
                  <p>{formatShortDate(event.date)} · {event.eventType} · importance {event.estimatedImportance}/100</p>
                  <p className="mt-2 text-slate-600">{event.sourceText}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <p><strong>Late policy:</strong> Placeholder extracted policy, 10% per day when present.</p>
              <p><strong>Recurring pattern:</strong> Weekly homework and reading checks are treated as routine unless the syllabus assigns unusual weight.</p>
              <p><strong>Manual correction:</strong> Placeholder button for editing extracted dates, weights, and confidence.</p>
            </div>
          </Section>
        ))}
      </div>
    </>
  );
}
