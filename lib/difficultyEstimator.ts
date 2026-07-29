import type { Assignment, DifficultyLevel, SyllabusEvent } from "./types";

const majorWords = ["midterm", "final", "exam", "research", "paper", "project", "presentation", "portfolio", "cumulative"];
const effortWords = ["analyze", "research", "presentation", "draft", "revise", "cumulative", "lab report", "sources", "rubric"];

export function estimateDifficulty(assignment: Assignment, syllabusContext: SyllabusEvent[] = []) {
  const text = `${assignment.name} ${assignment.description} ${assignment.assignmentType}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  if (["paper", "research_paper", "project", "presentation", "midterm", "final", "exam"].includes(assignment.assignmentType)) {
    score += 35;
    reasons.push("The assignment type usually requires planning beyond a single sitting.");
  }
  if (assignment.pointsPossible >= 80) {
    score += 20;
    reasons.push("It has a high point value compared with routine work.");
  }
  const matchedMajor = majorWords.filter((word) => text.includes(word));
  if (matchedMajor.length) {
    score += 18;
    reasons.push(`The description includes major-work signals: ${matchedMajor.slice(0, 3).join(", ")}.`);
  }
  const matchedEffort = effortWords.filter((word) => text.includes(word));
  if (matchedEffort.length) {
    score += 12;
    reasons.push("The wording suggests research, revision, analysis, or a detailed rubric.");
  }
  if (assignment.description.length > 240) {
    score += 8;
    reasons.push("The assignment has a longer description with multiple requirements.");
  }
  if (syllabusContext.some((event) => event.title.toLowerCase().includes(assignment.name.toLowerCase()) || event.estimatedImportance >= 80)) {
    score += 12;
    reasons.push("The syllabus marks this kind of work as important.");
  }
  if (["homework", "discussion", "reading"].includes(assignment.assignmentType) && assignment.pointsPossible <= 20) {
    score -= 20;
    reasons.push("It is low-point routine coursework, so it should feel manageable.");
  }

  let difficultyLevel: DifficultyLevel = "MEDIUM";
  if (score < 25) difficultyLevel = "EASY";
  else if (score < 55) difficultyLevel = "MEDIUM";
  else if (score < 78) difficultyLevel = "HARD";
  else difficultyLevel = "MAJOR";

  const baseMinutes = assignment.estimatedMinutes || 45;
  const estimatedMinutes = Math.max(20, Math.round((baseMinutes + score * 6) / 15) * 15);

  if (!reasons.length) reasons.push("It appears to be standard coursework with moderate effort.");
  return { difficultyLevel, estimatedMinutes, reasons };
}
