import { Badge, PageHeader, ProgressBar, Section } from "@/components/ui";
import { assignmentGroups, courses, currentDate, submissions } from "@/lib/mockData";
import { enrichedAssignments } from "@/lib/data";
import { calculatePointsBasedGrade, calculateTargetScore, calculateWeightedGrade, calculateWhatIfGrade } from "@/lib/gradeCalculator";

export default function GradesPage() {
  return (
    <>
      <PageHeader title="Grades" eyebrow="Official totals and CoursePilot estimates" />
      <div className="grid gap-5 xl:grid-cols-2">
        {courses.map((course) => {
          const courseAssignments = enrichedAssignments.filter((assignment) => assignment.courseId === course.id);
          const groups = assignmentGroups.filter((group) => group.courseId === course.id);
          const estimated = course.gradingMode === "weighted" ? calculateWeightedGrade(courseAssignments, submissions, groups, { currentDate, countMissingPastDueAsZero: true, ignoreUngradedAssignments: true }) : calculatePointsBasedGrade(courseAssignments, submissions, { currentDate, countMissingPastDueAsZero: true, ignoreUngradedAssignments: true });
          const whatIf = calculateWhatIfGrade(courseAssignments, submissions, groups, { [courseAssignments[0]?.id ?? ""]: (courseAssignments[0]?.pointsPossible ?? 100) * 0.85 }, { currentDate, countMissingPastDueAsZero: true, ignoreUngradedAssignments: true });
          return (
            <Section key={course.id} title={course.name} action={<Badge tone={estimated.confidence === "HIGH" ? "green" : "amber"}>{estimated.confidence} confidence</Badge>}>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3 sm:p-4">
                    <p className="text-sm text-slate-500">Canvas official grade</p>
                    <p className="text-xl font-semibold sm:text-2xl">{course.finalGradesHidden ? "Hidden" : `${course.officialCurrentScore}% ${course.officialCurrentGrade ?? ""}`}</p>
                  </div>
                  <div className="rounded-lg bg-mist p-3 sm:p-4">
                    <p className="text-sm text-slate-500">CoursePilot estimated grade</p>
                    <p className="text-xl font-semibold sm:text-2xl">{estimated.score}%</p>
                  </div>
                </div>
                {course.finalGradesHidden && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Canvas official total is hidden for this course. CoursePilot estimated your grade using visible graded assignments, assignment weights, and syllabus rules.</p>}
                <div className="space-y-2">
                  {groups.map((group) => <div key={group.id}><div className="mb-1 flex justify-between text-sm"><span>{group.name}</span><span>{group.weight ? `${group.weight}%` : "points"}</span></div><ProgressBar value={group.weight ?? 55} /></div>)}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">What if I get 85% on the next item? Estimate: <strong>{whatIf.score}%</strong></div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">Need on remaining 20% for an A: <strong>{calculateTargetScore(estimated.score, 90, 20)}%</strong></div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">Missing: <strong>{submissions.filter((s) => s.missing && courseAssignments.some((a) => a.id === s.assignmentId)).length}</strong>. Ungraded future work is ignored.</div>
                </div>
              </div>
            </Section>
          );
        })}
      </div>
    </>
  );
}
