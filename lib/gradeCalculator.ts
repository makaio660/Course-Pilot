import type { Assignment, AssignmentGroup, ConfidenceLevel, Submission } from "./types";

type GradeOptions = {
  currentDate?: Date;
  ignoreUngradedAssignments?: boolean;
  countMissingPastDueAsZero?: boolean;
};

type GradeResult = {
  score: number;
  confidence: ConfidenceLevel;
  warnings: string[];
};

function usableScore(assignment: Assignment, submission: Submission | undefined, options: GradeOptions) {
  if (assignment.omitFromFinalGrade || submission?.excused) return undefined;
  if (typeof submission?.score === "number") return submission.score;
  const due = new Date(assignment.dueAt);
  if (options.countMissingPastDueAsZero && submission?.missing && options.currentDate && due < options.currentDate) return 0;
  if (options.ignoreUngradedAssignments !== false) return undefined;
  return 0;
}

export function calculatePointsBasedGrade(assignments: Assignment[], submissions: Submission[], options: GradeOptions = {}): GradeResult {
  let earned = 0;
  let possible = 0;
  for (const assignment of assignments) {
    const score = usableScore(assignment, submissions.find((s) => s.assignmentId === assignment.id), options);
    if (typeof score === "number") {
      earned += score;
      possible += assignment.pointsPossible;
    }
  }
  const score = possible ? (earned / possible) * 100 : 0;
  return { score: Math.round(score * 10) / 10, confidence: possible > 150 ? "HIGH" : possible > 50 ? "MEDIUM" : "LOW", warnings: [] };
}

export function calculateWeightedGrade(
  assignments: Assignment[],
  submissions: Submission[],
  assignmentGroups: AssignmentGroup[],
  options: GradeOptions = {}
): GradeResult {
  const warnings: string[] = [];
  const weightedGroups = assignmentGroups.filter((group) => typeof group.weight === "number");
  if (!weightedGroups.length) {
    const fallback = calculatePointsBasedGrade(assignments, submissions, options);
    return { ...fallback, confidence: "LOW", warnings: ["Weights are missing, so CoursePilot fell back to a points-based estimate."] };
  }

  let total = 0;
  let usedWeight = 0;
  for (const group of weightedGroups) {
    const groupAssignments = assignments.filter((assignment) => assignment.assignmentGroupId === group.id);
    const groupGrade = calculatePointsBasedGrade(groupAssignments, submissions, options);
    if (groupGrade.score > 0) {
      total += groupGrade.score * ((group.weight ?? 0) / 100);
      usedWeight += group.weight ?? 0;
    }
  }
  const score = usedWeight ? total / (usedWeight / 100) : 0;
  const totalKnownWeight = weightedGroups.reduce((sum, group) => sum + (group.weight ?? 0), 0);
  const confidence: ConfidenceLevel = totalKnownWeight >= 90 ? "HIGH" : usedWeight >= 40 ? "MEDIUM" : "LOW";
  return { score: Math.round(score * 10) / 10, confidence, warnings };
}

export function calculateWhatIfGrade(
  assignments: Assignment[],
  submissions: Submission[],
  assignmentGroups: AssignmentGroup[],
  whatIfScores: Record<string, number>,
  options: GradeOptions = {}
) {
  const merged = assignments.map((assignment) => {
    const existing = submissions.find((submission) => submission.assignmentId === assignment.id);
    if (whatIfScores[assignment.id] === undefined) return existing;
    return {
      id: `what-if-${assignment.id}`,
      assignmentId: assignment.id,
      userId: existing?.userId ?? "mock-user",
      score: whatIfScores[assignment.id],
      workflowState: "graded" as const,
      late: false,
      missing: false,
      excused: false
    };
  }).filter(Boolean) as Submission[];
  return assignmentGroups.some((group) => group.weight) ? calculateWeightedGrade(assignments, merged, assignmentGroups, options) : calculatePointsBasedGrade(assignments, merged, options);
}

export function calculateTargetScore(currentGrade: number, targetGrade: number, remainingAssignmentWeight: number) {
  if (remainingAssignmentWeight <= 0) return Infinity;
  const currentWeight = 100 - remainingAssignmentWeight;
  return Math.round(((targetGrade - currentGrade * (currentWeight / 100)) / (remainingAssignmentWeight / 100)) * 10) / 10;
}
