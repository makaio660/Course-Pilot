import type { Assignment, AssignmentGroup, Course, Submission, SyllabusEvent, TaskPlan, User } from "./types";

export const currentDate = new Date("2026-01-20T12:00:00-08:00");

export const user: User = {
  id: "user-1",
  name: "Maya Chen",
  email: "maya@example.edu",
  timezone: "America/Los_Angeles",
  settings: {
    dailyDigestEnabled: true,
    weeklyDigestEnabled: true,
    monthlyDigestEnabled: true,
    digestTime: "7:30 AM",
    weeklyDigestDay: "Sunday",
    monthlyDigestDay: 1,
    alertSensitivity: "normal",
    emailImportanceThreshold: 45,
    canvasBaseUrl: "https://school.instructure.com",
    gradeCalculationPreference: "syllabus",
    countMissingPastDueAsZero: true,
    ignoreUngradedAssignments: true
  }
};

export const courses: Course[] = [
  { id: "bio", userId: user.id, canvasCourseId: "101", name: "Biology 101", courseCode: "BIO 101", termName: "Spring 2026", syllabusText: "Exams 30%, labs 25%, homework 15%, final 30%. Midterm Feb 15 covers chapters 1-5.", gradingMode: "weighted", officialCurrentScore: 88, officialCurrentGrade: "B+", estimatedCurrentScore: 87.8, finalGradesHidden: false },
  { id: "eng", userId: user.id, canvasCourseId: "202", name: "English Literature", courseCode: "ENG 202", termName: "Spring 2026", syllabusText: "Papers 45%, discussion 15%, reading checks 10%, final portfolio 30%. Research paper due Feb 15.", gradingMode: "weighted", estimatedCurrentScore: 87, finalGradesHidden: true },
  { id: "chem", userId: user.id, canvasCourseId: "110", name: "Chemistry", courseCode: "CHEM 110", termName: "Spring 2026", syllabusText: "Points based. Homework weekly, labs biweekly, exams announced in Canvas.", gradingMode: "points", officialCurrentScore: 91, officialCurrentGrade: "A-", estimatedCurrentScore: 90.5, finalGradesHidden: false },
  { id: "hist", userId: user.id, canvasCourseId: "211", name: "U.S. History", courseCode: "HIST 211", termName: "Spring 2026", syllabusText: "Exams 25%, presentation 20%, project 25%, participation 10%, weekly responses 20%.", gradingMode: "weighted", estimatedCurrentScore: 84, finalGradesHidden: true }
];

export const assignmentGroups: AssignmentGroup[] = [
  { id: "bio-exams", courseId: "bio", name: "Exams", weight: 30 },
  { id: "bio-labs", courseId: "bio", name: "Labs", weight: 25 },
  { id: "bio-hw", courseId: "bio", name: "Homework", weight: 15 },
  { id: "eng-papers", courseId: "eng", name: "Papers", weight: 45 },
  { id: "eng-disc", courseId: "eng", name: "Discussion", weight: 15 },
  { id: "eng-portfolio", courseId: "eng", name: "Portfolio", weight: 30 },
  { id: "chem-points", courseId: "chem", name: "Course Points" },
  { id: "hist-exams", courseId: "hist", name: "Exams", weight: 25 },
  { id: "hist-project", courseId: "hist", name: "Project", weight: 25 },
  { id: "hist-pres", courseId: "hist", name: "Presentation", weight: 20 },
  { id: "hist-response", courseId: "hist", name: "Responses", weight: 20 }
];

const base = { submissionTypes: ["online_text_entry"], gradingType: "points" as const, htmlUrl: "#", lastSyncedAt: "2026-01-20T08:00:00Z", omitFromFinalGrade: false };

export const assignments: Assignment[] = [
  { ...base, id: "bio-midterm", courseId: "bio", assignmentGroupId: "bio-exams", name: "Biology Midterm", description: "Cumulative exam covering chapters 1-5, cell structure, genetics, and lab methods.", dueAt: "2026-02-15T09:00:00-08:00", pointsPossible: 100, assignmentType: "midterm", isMajor: true, difficultyLevel: "MAJOR", estimatedMinutes: 780, priorityScore: 0, alertLevel: "PLAN_AHEAD", importanceReason: "Exam category is 30% of the course grade and covers 5 chapters.", completionStatus: "not_started" },
  { ...base, id: "bio-lab-1", courseId: "bio", assignmentGroupId: "bio-labs", name: "Microscope Lab Report", description: "Analyze observations and submit a lab report with labeled diagrams.", dueAt: "2026-01-27T23:59:00-08:00", pointsPossible: 45, assignmentType: "lab", isMajor: false, difficultyLevel: "MEDIUM", estimatedMinutes: 150, priorityScore: 0, alertLevel: "FOCUS_THIS_WEEK", importanceReason: "Lab reports build the 25% lab category.", completionStatus: "in_progress" },
  { ...base, id: "bio-hw-3", courseId: "bio", assignmentGroupId: "bio-hw", name: "Biology Homework 3", description: "Chapter 4 practice problems.", dueAt: "2026-01-22T23:59:00-08:00", pointsPossible: 15, assignmentType: "homework", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 40, priorityScore: 0, alertLevel: "QUICK_WIN", importanceReason: "Routine low-point practice.", completionStatus: "not_started" },
  { ...base, id: "bio-final", courseId: "bio", assignmentGroupId: "bio-exams", name: "Biology Final Exam", description: "Cumulative final exam across all units.", dueAt: "2026-05-12T09:00:00-07:00", pointsPossible: 120, assignmentType: "final", isMajor: true, difficultyLevel: "MAJOR", estimatedMinutes: 900, priorityScore: 0, alertLevel: "PLAN_AHEAD", importanceReason: "Final exam is a major syllabus date.", completionStatus: "not_started" },
  { ...base, id: "eng-paper", courseId: "eng", assignmentGroupId: "eng-papers", name: "English Research Paper", description: "A 6-8 page research paper requiring at least 5 outside sources, thesis, citations, draft, and revision.", dueAt: "2026-02-15T23:59:00-08:00", pointsPossible: 100, assignmentType: "research_paper", isMajor: true, difficultyLevel: "HARD", estimatedMinutes: 600, priorityScore: 0, alertLevel: "START_SOON", importanceReason: "Worth 20% of course grade and requires outside sources.", completionStatus: "not_started" },
  { ...base, id: "eng-disc-2", courseId: "eng", assignmentGroupId: "eng-disc", name: "Discussion: Modernism", description: "Post one response and reply to two classmates.", dueAt: "2026-01-23T23:59:00-08:00", pointsPossible: 10, assignmentType: "discussion", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 35, priorityScore: 0, alertLevel: "QUICK_WIN", importanceReason: "Small discussion assignment.", completionStatus: "not_started" },
  { ...base, id: "eng-reading", courseId: "eng", assignmentGroupId: "eng-disc", name: "Reading Check 4", description: "Short reading quiz on assigned poems.", dueAt: "2026-01-21T23:59:00-08:00", pointsPossible: 8, assignmentType: "quiz", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 25, priorityScore: 0, alertLevel: "QUICK_WIN", importanceReason: "Low-point check for completion.", completionStatus: "not_started" },
  { ...base, id: "eng-portfolio", courseId: "eng", assignmentGroupId: "eng-portfolio", name: "Final Portfolio", description: "Revise three major pieces and write a reflective letter.", dueAt: "2026-05-08T23:59:00-07:00", pointsPossible: 100, assignmentType: "project", isMajor: true, difficultyLevel: "MAJOR", estimatedMinutes: 720, priorityScore: 0, alertLevel: "PLAN_AHEAD", importanceReason: "Portfolio is 30% of the course grade.", completionStatus: "not_started" },
  { ...base, id: "chem-hw-4", courseId: "chem", assignmentGroupId: "chem-points", name: "Chemistry Homework 4", description: "Standard stoichiometry homework set similar to previous homework.", dueAt: "2026-01-21T23:59:00-08:00", pointsPossible: 10, assignmentType: "homework", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 40, priorityScore: 0, alertLevel: "QUICK_WIN", importanceReason: "Low points and standard homework format.", completionStatus: "not_started" },
  { ...base, id: "chem-lab", courseId: "chem", assignmentGroupId: "chem-points", name: "Titration Lab", description: "Complete pre-lab, collect data, and submit a short lab report.", dueAt: "2026-01-29T23:59:00-08:00", pointsPossible: 50, assignmentType: "lab", isMajor: false, difficultyLevel: "MEDIUM", estimatedMinutes: 160, priorityScore: 0, alertLevel: "FOCUS_THIS_WEEK", importanceReason: "Moderate lab points.", completionStatus: "not_started" },
  { ...base, id: "chem-quiz", courseId: "chem", assignmentGroupId: "chem-points", name: "Quiz: Moles", description: "Short quiz on mole conversions.", dueAt: "2026-01-24T12:00:00-08:00", pointsPossible: 20, assignmentType: "quiz", isMajor: false, difficultyLevel: "MEDIUM", estimatedMinutes: 60, priorityScore: 0, alertLevel: "FOCUS_THIS_WEEK", importanceReason: "Quiz can affect points total.", completionStatus: "not_started" },
  { ...base, id: "hist-presentation", courseId: "hist", assignmentGroupId: "hist-pres", name: "Reconstruction Presentation", description: "Group presentation with slide deck, annotated sources, and speaking notes.", dueAt: "2026-02-20T10:00:00-08:00", pointsPossible: 80, assignmentType: "presentation", isMajor: true, difficultyLevel: "HARD", estimatedMinutes: 420, priorityScore: 0, alertLevel: "PLAN_AHEAD", importanceReason: "Presentation category is 20% of the course grade.", completionStatus: "not_started" },
  { ...base, id: "hist-project", courseId: "hist", assignmentGroupId: "hist-project", name: "Primary Source Final Project", description: "Research project using primary sources, analysis, bibliography, and visual exhibit.", dueAt: "2026-04-24T23:59:00-07:00", pointsPossible: 100, assignmentType: "project", isMajor: true, difficultyLevel: "MAJOR", estimatedMinutes: 840, priorityScore: 0, alertLevel: "PLAN_AHEAD", importanceReason: "Final project is 25% of the course grade.", completionStatus: "not_started" },
  { ...base, id: "hist-response", courseId: "hist", assignmentGroupId: "hist-response", name: "Weekly Response 3", description: "One-page response to assigned reading.", dueAt: "2026-01-22T23:59:00-08:00", pointsPossible: 12, assignmentType: "discussion", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 45, priorityScore: 0, alertLevel: "QUICK_WIN", importanceReason: "Routine weekly response.", completionStatus: "not_started" },
  { ...base, id: "hist-exam", courseId: "hist", assignmentGroupId: "hist-exams", name: "Unit 1 Exam", description: "Exam on early republic and civil war material.", dueAt: "2026-02-06T11:00:00-08:00", pointsPossible: 75, assignmentType: "exam", isMajor: true, difficultyLevel: "HARD", estimatedMinutes: 360, priorityScore: 0, alertLevel: "START_SOON", importanceReason: "Exams are 25% of course grade.", completionStatus: "not_started" },
  { ...base, id: "bio-hw-1", courseId: "bio", assignmentGroupId: "bio-hw", name: "Biology Homework 1", description: "Chapter 1 questions.", dueAt: "2026-01-12T23:59:00-08:00", pointsPossible: 15, assignmentType: "homework", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 35, priorityScore: 0, alertLevel: "OVERDUE", importanceReason: "Past-due missing example.", completionStatus: "not_started" },
  { ...base, id: "chem-hw-2", courseId: "chem", assignmentGroupId: "chem-points", name: "Chemistry Homework 2", description: "Atomic structure practice.", dueAt: "2026-01-14T23:59:00-08:00", pointsPossible: 10, assignmentType: "homework", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 30, priorityScore: 0, alertLevel: "OVERDUE", importanceReason: "Missing homework can be counted as zero.", completionStatus: "not_started" },
  { ...base, id: "eng-essay-1", courseId: "eng", assignmentGroupId: "eng-papers", name: "Close Reading Essay", description: "Short essay analyzing a passage.", dueAt: "2026-01-16T23:59:00-08:00", pointsPossible: 50, assignmentType: "paper", isMajor: false, difficultyLevel: "HARD", estimatedMinutes: 180, priorityScore: 0, alertLevel: "DUE_SOON", importanceReason: "Paper category has a high weight.", completionStatus: "done" },
  { ...base, id: "chem-hw-3", courseId: "chem", assignmentGroupId: "chem-points", name: "Chemistry Homework 3", description: "Ionic compounds worksheet.", dueAt: "2026-01-18T23:59:00-08:00", pointsPossible: 10, assignmentType: "homework", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 30, priorityScore: 0, alertLevel: "DUE_SOON", importanceReason: "Recent graded homework.", completionStatus: "done" },
  { ...base, id: "hist-response-2", courseId: "hist", assignmentGroupId: "hist-response", name: "Weekly Response 2", description: "One-page response to federalism reading.", dueAt: "2026-01-15T23:59:00-08:00", pointsPossible: 12, assignmentType: "discussion", isMajor: false, difficultyLevel: "EASY", estimatedMinutes: 45, priorityScore: 0, alertLevel: "DUE_SOON", importanceReason: "Recent graded response.", completionStatus: "done" }
];

export const submissions: Submission[] = [
  { id: "sub-bio-hw1", assignmentId: "bio-hw-1", userId: user.id, workflowState: "unsubmitted", late: false, missing: true, excused: false },
  { id: "sub-chem-hw2", assignmentId: "chem-hw-2", userId: user.id, workflowState: "unsubmitted", late: false, missing: true, excused: false },
  { id: "sub-eng-essay", assignmentId: "eng-essay-1", userId: user.id, submittedAt: "2026-01-16T20:00:00Z", score: 43, grade: "86%", workflowState: "graded", late: false, missing: false, excused: false },
  { id: "sub-chem-hw3", assignmentId: "chem-hw-3", userId: user.id, submittedAt: "2026-01-18T21:00:00Z", score: 9, grade: "90%", workflowState: "graded", late: false, missing: false, excused: false },
  { id: "sub-hist-response2", assignmentId: "hist-response-2", userId: user.id, submittedAt: "2026-01-15T21:00:00Z", score: 10, grade: "83%", workflowState: "graded", late: false, missing: false, excused: false }
];

export const syllabusEvents: SyllabusEvent[] = [
  { id: "sy-bio-midterm", courseId: "bio", title: "Biology Midterm", eventType: "exam", date: "2026-02-15T09:00:00-08:00", estimatedImportance: 92, sourceText: "Midterm Feb 15 covers chapters 1-5. Exams are 30%.", confidence: "HIGH" },
  { id: "sy-eng-paper", courseId: "eng", title: "English Research Paper", eventType: "paper", date: "2026-02-15T23:59:00-08:00", estimatedImportance: 88, sourceText: "Research paper due Feb 15; papers are 45% total.", confidence: "HIGH" },
  { id: "sy-hist-pres", courseId: "hist", title: "Reconstruction Presentation", eventType: "presentation", date: "2026-02-20T10:00:00-08:00", estimatedImportance: 80, sourceText: "Presentation is 20% of grade.", confidence: "MEDIUM" },
  { id: "sy-chem-homework", courseId: "chem", title: "Weekly Chemistry Homework", eventType: "homework", date: "2026-01-21T23:59:00-08:00", estimatedImportance: 30, sourceText: "Homework assigned weekly.", confidence: "MEDIUM" }
];

export const taskPlans: TaskPlan[] = [
  { id: "plan-paper-topic", assignmentId: "eng-paper", title: "Choose topic", dueAt: "2026-02-01T09:00:00-08:00", estimatedMinutes: 45, status: "not_started", generatedReason: "Paper milestone created from the Feb 15 due date." },
  { id: "plan-paper-sources", assignmentId: "eng-paper", title: "Gather sources", dueAt: "2026-02-03T09:00:00-08:00", estimatedMinutes: 90, status: "not_started", generatedReason: "Research papers need sources before drafting." },
  { id: "plan-paper-outline", assignmentId: "eng-paper", title: "Create outline", dueAt: "2026-02-06T09:00:00-08:00", estimatedMinutes: 75, status: "not_started", generatedReason: "Outline before first draft." },
  { id: "plan-paper-draft", assignmentId: "eng-paper", title: "Write first draft", dueAt: "2026-02-09T09:00:00-08:00", estimatedMinutes: 180, status: "not_started", generatedReason: "Draft needs revision time." },
  { id: "plan-paper-revise", assignmentId: "eng-paper", title: "Revise", dueAt: "2026-02-12T09:00:00-08:00", estimatedMinutes: 120, status: "not_started", generatedReason: "Revision before final submission." },
  { id: "plan-bio-review", assignmentId: "bio-midterm", title: "Review chapters 1-2", dueAt: "2026-01-25T09:00:00-08:00", estimatedMinutes: 90, status: "not_started", generatedReason: "Major exam preparation begins three weeks ahead." }
];
