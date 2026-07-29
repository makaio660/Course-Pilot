import { daysBetween, formatShortDate } from "./dateUtils";
import { assignmentGroups, syllabusEvents } from "./mockData";
import { calculateAssignmentPriority } from "./priorityEngine";
import type { Assignment, Course, DigestSection, DigestType, Submission, User } from "./types";

export function buildDigest(user: User, courses: Course[], assignments: Assignment[], submissions: Submission[], date: Date, digestType: DigestType) {
  const prioritized = assignments
    .map((assignment) => {
      const course = courses.find((item) => item.id === assignment.courseId)!;
      const group = assignmentGroups.find((item) => item.id === assignment.assignmentGroupId);
      const priority = calculateAssignmentPriority(assignment, course, syllabusEvents, date, user.settings, group);
      return { ...assignment, courseName: course.name, ...priority };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const inDays = (max: number) => prioritized.filter((assignment) => {
    const days = daysBetween(date, new Date(assignment.dueAt));
    return days >= 0 && days <= max;
  });
  const majors = prioritized.filter((assignment) => assignment.isMajor);
  const quickWins = prioritized.filter((assignment) => assignment.alertLevel === "QUICK_WIN");
  const focus = prioritized.filter((assignment) => !["done"].includes(assignment.completionStatus)).slice(0, 4);

  let subject = "";
  let sections: DigestSection[] = [];
  if (digestType === "DAILY") {
    subject = `Today's CoursePilot: ${focus.length} focus items, ${quickWins.length} quick win${quickWins.length === 1 ? "" : "s"}`;
    sections = [
      { title: "Due today", items: inDays(0).map((a) => `${a.name} for ${a.courseName}`) },
      { title: "Due tomorrow", items: inDays(1).filter((a) => daysBetween(date, new Date(a.dueAt)) === 1).map((a) => `${a.name} (${a.alertLevel.replaceAll("_", " ")})`) },
      { title: "Best use of 60 minutes today", items: focus.slice(0, 2).map((a) => `${a.name}: ${a.reasons[0]}`) },
      { title: "Quick wins", items: quickWins.slice(0, 5).map((a) => `${a.name}, about ${a.estimatedMinutes} minutes`) },
      { title: "Major deadline getting closer", items: majors.slice(0, 2).map((a) => `${a.name}, due ${formatShortDate(a.dueAt)}`) }
    ];
  } else if (digestType === "WEEKLY") {
    subject = "Your week ahead: what matters most";
    sections = [
      { title: "Top priorities this week", items: focus.map((a) => `${a.name}: ${a.priorityScore}/100`) },
      { title: "Assignments due in the next 7 days", items: inDays(7).map((a) => `${formatShortDate(a.dueAt)}: ${a.name}`) },
      { title: "Major deadlines in the next 30 days", items: majors.filter((a) => daysBetween(date, new Date(a.dueAt)) <= 30).map((a) => `${a.name}, due ${formatShortDate(a.dueAt)}`) },
      { title: "Suggested study/work blocks", items: ["Monday: 45 minutes for Chemistry Homework", "Tuesday: 60 minutes for Biology Midterm review", "Wednesday: 90 minutes for English Research Paper outline"] }
    ];
  } else {
    subject = "Your month ahead: exams, papers, and big deadlines";
    sections = [
      { title: "Major exams", items: majors.filter((a) => ["midterm", "exam", "final"].includes(a.assignmentType)).map((a) => `${a.name}, due ${formatShortDate(a.dueAt)}`) },
      { title: "Papers", items: majors.filter((a) => a.assignmentType.includes("paper")).map((a) => `${a.name}, recommended start: Feb 1`) },
      { title: "Projects", items: majors.filter((a) => a.assignmentType === "project").map((a) => `${a.name}, due ${formatShortDate(a.dueAt)}`) },
      { title: "Recommended start dates", items: majors.slice(0, 4).map((a) => `${a.name}: start at least ${a.assignmentType === "homework" ? 3 : 14} days early`) },
      { title: "Courses with grade risk", items: courses.filter((course) => course.finalGradesHidden).map((course) => `${course.name}: estimated grade only because Canvas total is hidden`) }
    ];
  }

  const plainTextBody = sections.map((section) => `${section.title}\n${section.items.join("\n") || "Nothing pressing."}`).join("\n\n");
  const htmlBody = sections.map((section) => `<h2>${section.title}</h2><ul>${(section.items.length ? section.items : ["Nothing pressing."]).map((item) => `<li>${item}</li>`).join("")}</ul>`).join("");
  return { subject, sections, plainTextBody, htmlBody };
}
