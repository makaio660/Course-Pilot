import { describe, expect, it } from "vitest";
import { buildDigest } from "@/lib/digestBuilder";
import { CanvasApiError, normalizeCanvasBaseUrl } from "@/lib/canvas/CanvasClient";
import { estimateDifficulty } from "@/lib/difficultyEstimator";
import { calculatePointsBasedGrade, calculateWeightedGrade, calculateWhatIfGrade } from "@/lib/gradeCalculator";
import { calculateAssignmentPriority } from "@/lib/priorityEngine";
import { assignmentGroups, assignments, courses, currentDate, submissions, syllabusEvents, user } from "@/lib/mockData";

const byId = (id: string) => assignments.find((assignment) => assignment.id === id)!;
const courseFor = (assignmentId: string) => courses.find((course) => course.id === byId(assignmentId).courseId)!;
const groupFor = (assignmentId: string) => assignmentGroups.find((group) => group.id === byId(assignmentId).assignmentGroupId);

describe("CoursePilot priority engine", () => {
  it("surfaces the Feb 15 major midterm early", () => {
    const assignment = byId("bio-midterm");
    const result = calculateAssignmentPriority(assignment, courseFor(assignment.id), syllabusEvents, currentDate, user.settings, groupFor(assignment.id));
    expect(["MAJOR_DEADLINE", "START_SOON", "PLAN_AHEAD"]).toContain(result.alertLevel);
    expect(result.priorityScore).toBeGreaterThanOrEqual(60);
    expect(result.reasons.join(" ")).toContain("major work");
  });

  it("keeps simple homework due tomorrow out of Major Deadline", () => {
    const assignment = byId("chem-hw-4");
    const result = calculateAssignmentPriority(assignment, courseFor(assignment.id), syllabusEvents, currentDate, user.settings, groupFor(assignment.id));
    expect(["QUICK_WIN", "DUE_SOON"]).toContain(result.alertLevel);
    expect(result.alertLevel).not.toBe("MAJOR_DEADLINE");
  });

  it("does not panic over low-impact homework in the daily digest", () => {
    const digest = buildDigest(user, courses, assignments, submissions, currentDate, "DAILY");
    const quickWinText = digest.sections.find((section) => section.title === "Quick wins")?.items.join(" ");
    expect(quickWinText).toContain("Chemistry Homework 4");
    expect(quickWinText).not.toContain("Major Deadline");
  });
});

describe("CoursePilot difficulty estimator", () => {
  it("marks the research paper as hard or major", () => {
    const result = estimateDifficulty(byId("eng-paper"), syllabusEvents);
    expect(["HARD", "MAJOR"]).toContain(result.difficultyLevel);
    expect(result.reasons.join(" ")).toMatch(/research|major-work|high point/i);
  });
});

describe("CoursePilot grade calculator", () => {
  it("calculates weighted grades", () => {
    const courseAssignments = assignments.filter((assignment) => assignment.courseId === "eng");
    const groups = assignmentGroups.filter((group) => group.courseId === "eng");
    const result = calculateWeightedGrade(courseAssignments, submissions, groups, { currentDate, ignoreUngradedAssignments: true });
    expect(result.score).toBeGreaterThan(80);
    expect(result.confidence).toBe("HIGH");
  });

  it("calculates points-based grades", () => {
    const courseAssignments = assignments.filter((assignment) => assignment.courseId === "chem");
    const result = calculatePointsBasedGrade(courseAssignments, submissions, { currentDate, ignoreUngradedAssignments: true });
    expect(result.score).toBe(90);
  });

  it("labels hidden Canvas grades as estimated in the data model", () => {
    const english = courses.find((course) => course.id === "eng")!;
    expect(english.finalGradesHidden).toBe(true);
    expect(english.officialCurrentScore).toBeUndefined();
    expect(english.estimatedCurrentScore).toBeDefined();
  });

  it("can count missing past-due assignments as zero", () => {
    const courseAssignments = assignments.filter((assignment) => assignment.courseId === "chem");
    const ignored = calculatePointsBasedGrade(courseAssignments, submissions, { currentDate, ignoreUngradedAssignments: true, countMissingPastDueAsZero: false });
    const counted = calculatePointsBasedGrade(courseAssignments, submissions, { currentDate, ignoreUngradedAssignments: true, countMissingPastDueAsZero: true });
    expect(counted.score).toBeLessThan(ignored.score);
  });

  it("updates estimates with what-if scores", () => {
    const courseAssignments = assignments.filter((assignment) => assignment.courseId === "eng");
    const groups = assignmentGroups.filter((group) => group.courseId === "eng");
    const before = calculateWeightedGrade(courseAssignments, submissions, groups, { currentDate, ignoreUngradedAssignments: true });
    const after = calculateWhatIfGrade(courseAssignments, submissions, groups, { "eng-paper": 95 }, { currentDate, ignoreUngradedAssignments: true });
    expect(after.score).toBeGreaterThan(before.score);
  });
});

describe("CoursePilot digests", () => {
  it("includes far-away major deadlines in the monthly digest", () => {
    const digest = buildDigest(user, courses, assignments, submissions, currentDate, "MONTHLY");
    expect(digest.plainTextBody).toContain("Biology Midterm");
    expect(digest.plainTextBody).toContain("English Research Paper");
  });
});

describe("Canvas website connector", () => {
  it("normalizes school Canvas URLs to the website origin", () => {
    expect(normalizeCanvasBaseUrl("canvas.csun.edu/courses/123")).toBe("https://canvas.csun.edu");
    expect(normalizeCanvasBaseUrl("https://canvas.instructure.com/")).toBe("https://canvas.instructure.com");
  });

  it("rejects empty Canvas URLs", () => {
    expect(() => normalizeCanvasBaseUrl(" ")).toThrow(CanvasApiError);
  });
});
