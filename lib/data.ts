import { assignmentGroups, assignments, courses, currentDate, syllabusEvents, user } from "./mockData";
import { calculateAssignmentPriority } from "./priorityEngine";

export const enrichedAssignments = assignments.map((assignment) => {
  const course = courses.find((item) => item.id === assignment.courseId)!;
  const group = assignmentGroups.find((item) => item.id === assignment.assignmentGroupId);
  const priority = calculateAssignmentPriority(assignment, course, syllabusEvents, currentDate, user.settings, group);
  return { ...assignment, priorityScore: priority.priorityScore, alertLevel: priority.alertLevel, priorityReasons: priority.reasons };
});

export function getCourse(courseId: string) {
  return courses.find((course) => course.id === courseId);
}

export function getAssignment(id: string) {
  return enrichedAssignments.find((assignment) => assignment.id === id);
}
