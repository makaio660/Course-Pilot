import { TaskManager } from "@/components/TaskManager";
import { Badge, PageHeader } from "@/components/ui";
import { enrichedAssignments } from "@/lib/data";
import { courses } from "@/lib/mockData";

export default function AssignmentsPage() {
  return (
    <>
      <PageHeader title="Assignments" eyebrow="Search and filter">
        <div className="flex flex-wrap gap-2">
          {["Course", "Difficulty", "Due date", "Grade impact", "Missing", "Not started", "Major only", "Quick wins"].map((filter) => <Badge key={filter} tone="blue">{filter}</Badge>)}
        </div>
      </PageHeader>
      <TaskManager assignments={enrichedAssignments} courses={courses} />
    </>
  );
}
