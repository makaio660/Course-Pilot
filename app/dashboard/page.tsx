import { AssignmentCard } from "@/components/AssignmentCard";
import { Badge, PageHeader, Section } from "@/components/ui";
import { assignmentGroups, courses, currentDate, submissions, taskPlans } from "@/lib/mockData";
import { enrichedAssignments } from "@/lib/data";
import { calculatePointsBasedGrade, calculateWeightedGrade } from "@/lib/gradeCalculator";
import { formatShortDate } from "@/lib/dateUtils";

export default function DashboardPage() {
  const active = enrichedAssignments.filter((assignment) => assignment.completionStatus !== "done");
  const focus = active.filter((assignment) => assignment.alertLevel !== "QUICK_WIN").sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);
  const quickWins = active.filter((assignment) => assignment.alertLevel === "QUICK_WIN").slice(0, 4);
  const majors = active.filter((assignment) => assignment.isMajor).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 4);
  const recent = submissions.filter((submission) => submission.score !== undefined).slice(-3);

  return (
    <>
      <PageHeader title="Today’s command center" eyebrow="Dashboard">
        <div className="w-full rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-soft sm:w-auto">Mock date: {currentDate.toLocaleDateString()}</div>
      </PageHeader>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-5">
          <Section title="Today’s Focus">
            <div className="grid gap-3 sm:grid-cols-2">
              {focus.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} />)}
            </div>
          </Section>
          <Section title="Major Deadlines">
            <div className="grid gap-3 sm:grid-cols-2">
              {majors.map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="break-words font-semibold leading-snug">{assignment.name}</h3>
                    <Badge tone="amber">Major Deadline</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Due {formatShortDate(assignment.dueAt)}. Recommended start: {assignment.id === "eng-paper" ? "Feb 1" : "Jan 25"}.</p>
                  <p className="mt-2 text-sm text-slate-700">{assignment.importanceReason}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Suggested Study Blocks">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {["Monday: 45 minutes for Chemistry Homework", "Tuesday: 60 minutes for Biology Midterm review", "Wednesday: 90 minutes for English Research Paper outline"].map((item) => (
                <div key={item} className="rounded-lg bg-mist p-4 text-sm font-medium text-slate-700">{item}</div>
              ))}
            </div>
          </Section>
        </div>
        <div className="space-y-5">
          <Section title="Quick Wins">
            <div className="space-y-3">
              {quickWins.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} compact />)}
            </div>
          </Section>
          <Section title="Grade Risk">
            <div className="space-y-3">
              {courses.map((course) => {
                const courseAssignments = enrichedAssignments.filter((assignment) => assignment.courseId === course.id);
                const groups = assignmentGroups.filter((group) => group.courseId === course.id);
                const grade = course.gradingMode === "weighted" ? calculateWeightedGrade(courseAssignments, submissions, groups, { currentDate, countMissingPastDueAsZero: true, ignoreUngradedAssignments: true }) : calculatePointsBasedGrade(courseAssignments, submissions, { currentDate, countMissingPastDueAsZero: true, ignoreUngradedAssignments: true });
                const risky = courseAssignments.find((assignment) => assignment.isMajor);
                return (
                  <div key={course.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex justify-between gap-3"><h3 className="font-semibold">{course.name}</h3><Badge tone={course.finalGradesHidden ? "amber" : "green"}>{grade.confidence}</Badge></div>
                    <p className="text-sm text-slate-600">Estimated grade: {grade.score}%</p>
                    <p className="mt-2 text-sm text-slate-700">{risky?.name} impact: could move grade by about 6-8%.</p>
                  </div>
                );
              })}
            </div>
          </Section>
          <Section title="Recent Grade Changes">
            <div className="space-y-2">
              {recent.map((submission) => {
                const assignment = enrichedAssignments.find((item) => item.id === submission.assignmentId)!;
                return <p key={submission.id} className="rounded-lg bg-slate-50 p-3 text-sm">{assignment.name}: {submission.score}/{assignment.pointsPossible} helped refine the estimate.</p>;
              })}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
