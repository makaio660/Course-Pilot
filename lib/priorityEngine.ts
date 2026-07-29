import { daysBetween } from "./dateUtils";
import type { Assignment, AssignmentGroup, Course, PriorityResult, SyllabusEvent, UserSettings } from "./types";

const difficultyScores = { EASY: 18, MEDIUM: 45, HARD: 72, MAJOR: 92 };
const majorTypes = ["midterm", "final", "exam", "paper", "research_paper", "project", "presentation"];

function urgencyScore(daysUntilDue: number, isMajor: boolean) {
  if (daysUntilDue < 0) return 100;
  if (isMajor) {
    if (daysUntilDue <= 1) return 96;
    if (daysUntilDue <= 3) return 90;
    if (daysUntilDue <= 7) return 82;
    if (daysUntilDue <= 14) return 68;
    if (daysUntilDue <= 30) return 52;
    if (daysUntilDue <= 45) return 35;
    return 15;
  }
  if (daysUntilDue <= 1) return 78;
  if (daysUntilDue <= 3) return 58;
  if (daysUntilDue <= 7) return 38;
  return 12;
}

export function calculateAssignmentPriority(
  assignment: Assignment,
  course: Course,
  syllabusEvents: SyllabusEvent[],
  currentDate: Date,
  userSettings: UserSettings,
  assignmentGroup?: AssignmentGroup
): PriorityResult {
  const daysUntilDue = daysBetween(currentDate, new Date(assignment.dueAt));
  const groupWeight = assignmentGroup?.weight ?? 0;
  const isMajor = assignment.isMajor || majorTypes.includes(assignment.assignmentType) || assignment.difficultyLevel === "MAJOR";
  const sensitivity = userSettings.alertSensitivity === "high" ? 8 : userSettings.alertSensitivity === "low" ? -8 : 0;

  const urgency = urgencyScore(daysUntilDue, isMajor);
  const gradeImpact = Math.min(100, assignment.pointsPossible * 0.55 + groupWeight * 1.2 + (isMajor ? 18 : 0));
  const difficulty = difficultyScores[assignment.difficultyLevel];
  const relatedSyllabus = syllabusEvents.filter((event) => event.courseId === assignment.courseId);
  const syllabusImportance = Math.min(100, Math.max(...relatedSyllabus.map((event) => event.estimatedImportance), assignment.isMajor ? 70 : 20));
  let progressRisk = assignment.completionStatus === "done" ? 0 : assignment.completionStatus === "in_progress" ? 35 : 70;
  if (daysUntilDue < 0 || assignment.alertLevel === "OVERDUE") progressRisk = 100;
  if (assignment.completionStatus === "not_started" && daysUntilDue <= 3) progressRisk += 15;

  const rawScore =
    urgency * 0.25 +
    gradeImpact * 0.3 +
    difficulty * 0.2 +
    syllabusImportance * 0.15 +
    Math.min(progressRisk, 100) * 0.1 +
    sensitivity;
  const priorityScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  const reasons: string[] = [];
  if (daysUntilDue < 0) reasons.push("It is past due and still needs attention.");
  else reasons.push(`It is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}.`);
  if (groupWeight) reasons.push(`The ${assignmentGroup?.name} category is worth ${groupWeight}% of the course grade.`);
  if (assignment.pointsPossible >= 50) reasons.push(`It is worth ${assignment.pointsPossible} points, so it can noticeably affect the grade.`);
  if (isMajor) reasons.push("CoursePilot treats this as major work and surfaces it early.");
  if (assignment.completionStatus === "not_started") reasons.push("No work has been started yet.");
  if (course.finalGradesHidden) reasons.push("The official total is hidden, so CoursePilot uses visible scores and syllabus weights.");

  let alertLevel: PriorityResult["alertLevel"] = "PLAN_AHEAD";
  if (daysUntilDue < 0) alertLevel = "OVERDUE";
  else if (!isMajor && assignment.difficultyLevel === "EASY" && daysUntilDue <= 3) alertLevel = "QUICK_WIN";
  else if (isMajor && daysUntilDue <= 30) alertLevel = "MAJOR_DEADLINE";
  else if (isMajor && daysUntilDue <= 45) alertLevel = "PLAN_AHEAD";
  else if (priorityScore >= 78 || daysUntilDue <= 1) alertLevel = "DUE_SOON";
  else if (daysUntilDue <= 7) alertLevel = "FOCUS_THIS_WEEK";
  else if (daysUntilDue <= 21 || priorityScore >= 60) alertLevel = "START_SOON";

  return { priorityScore, alertLevel, reasons };
}
