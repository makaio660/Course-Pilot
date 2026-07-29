export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "MAJOR";
export type AlertLevel =
  | "PLAN_AHEAD"
  | "START_SOON"
  | "FOCUS_THIS_WEEK"
  | "DUE_SOON"
  | "OVERDUE"
  | "QUICK_WIN"
  | "MAJOR_DEADLINE";
export type AssignmentType =
  | "homework"
  | "discussion"
  | "quiz"
  | "lab"
  | "paper"
  | "research_paper"
  | "project"
  | "presentation"
  | "midterm"
  | "final"
  | "exam"
  | "reading";
export type CompletionStatus = "not_started" | "in_progress" | "done";
export type GradingMode = "points" | "weighted" | "unknown";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type UserSettings = {
  dailyDigestEnabled: boolean;
  weeklyDigestEnabled: boolean;
  monthlyDigestEnabled: boolean;
  digestTime: string;
  weeklyDigestDay: string;
  monthlyDigestDay: number;
  alertSensitivity: "low" | "normal" | "high";
  emailImportanceThreshold: number;
  canvasBaseUrl: string;
  gradeCalculationPreference: "canvas" | "syllabus" | "coursepilot";
  countMissingPastDueAsZero: boolean;
  ignoreUngradedAssignments: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  settings: UserSettings;
};

export type Course = {
  id: string;
  userId: string;
  canvasCourseId?: string;
  name: string;
  courseCode: string;
  termName: string;
  syllabusText: string;
  gradingMode: GradingMode;
  officialCurrentScore?: number;
  officialCurrentGrade?: string;
  estimatedCurrentScore?: number;
  finalGradesHidden: boolean;
  lastSyncedAt?: string;
};

export type AssignmentGroup = {
  id: string;
  courseId: string;
  canvasAssignmentGroupId?: string;
  name: string;
  weight?: number;
  dropLowest?: number;
  dropHighest?: number;
};

export type Assignment = {
  id: string;
  courseId: string;
  assignmentGroupId: string;
  canvasAssignmentId?: string;
  name: string;
  description: string;
  dueAt: string;
  unlockAt?: string;
  lockAt?: string;
  pointsPossible: number;
  submissionTypes: string[];
  gradingType: "points" | "percent" | "pass_fail";
  assignmentType: AssignmentType;
  isMajor: boolean;
  difficultyLevel: DifficultyLevel;
  estimatedMinutes: number;
  priorityScore: number;
  alertLevel: AlertLevel;
  importanceReason: string;
  htmlUrl?: string;
  lastSyncedAt?: string;
  omitFromFinalGrade?: boolean;
  completionStatus: CompletionStatus;
};

export type Submission = {
  id: string;
  assignmentId: string;
  userId: string;
  submittedAt?: string;
  score?: number;
  grade?: string;
  workflowState: "unsubmitted" | "submitted" | "graded";
  late: boolean;
  missing: boolean;
  excused: boolean;
};

export type SyllabusEvent = {
  id: string;
  courseId: string;
  title: string;
  eventType: "exam" | "paper" | "project" | "reading" | "homework" | "presentation" | "other";
  date: string;
  estimatedImportance: number;
  sourceText: string;
  confidence: ConfidenceLevel;
};

export type TaskPlan = {
  id: string;
  assignmentId: string;
  title: string;
  dueAt: string;
  estimatedMinutes: number;
  status: CompletionStatus;
  generatedReason: string;
};

export type PriorityResult = {
  priorityScore: number;
  alertLevel: AlertLevel;
  reasons: string[];
};

export type DigestType = "DAILY" | "WEEKLY" | "MONTHLY";
export type DigestSection = { title: string; items: string[] };
