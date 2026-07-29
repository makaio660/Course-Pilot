import { CalendarPlanner } from "@/components/CalendarPlanner";
import { PageHeader } from "@/components/ui";
import { enrichedAssignments } from "@/lib/data";
import { courses, currentDate, taskPlans } from "@/lib/mockData";

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" eyebrow="Plan the work before it becomes urgent" />
      <CalendarPlanner assignments={enrichedAssignments} courses={courses} taskPlans={taskPlans} currentDate={currentDate.toISOString()} />
    </>
  );
}
