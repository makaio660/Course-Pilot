const currentDate = new Date("2026-01-20T12:00:00-08:00");

const mockCourses = [
  { id: "bio", name: "Biology 101", code: "BIO 101", finalGradesHidden: false, estimatedGrade: 87.8, officialGrade: "88% B+" },
  { id: "eng", name: "English Literature", code: "ENG 202", finalGradesHidden: true, estimatedGrade: 87 },
  { id: "chem", name: "Chemistry", code: "CHEM 110", finalGradesHidden: false, estimatedGrade: 90.5, officialGrade: "91% A-" },
  { id: "hist", name: "U.S. History", code: "HIST 211", finalGradesHidden: true, estimatedGrade: 84 }
];

const mockAssignments = [
  { id: "bio-midterm", courseId: "bio", name: "Biology Midterm", dueAt: "2026-02-15T09:00:00-08:00", points: 100, type: "midterm", difficulty: "MAJOR", minutes: 780, isMajor: true, status: "not_started", reason: "Exam category is 30% of the course grade and covers 5 chapters." },
  { id: "eng-paper", courseId: "eng", name: "English Research Paper", dueAt: "2026-02-15T23:59:00-08:00", points: 100, type: "research paper", difficulty: "HARD", minutes: 600, isMajor: true, status: "not_started", reason: "Worth 20% of course grade, requires 5 outside sources, 6-8 pages, and revision." },
  { id: "hist-exam", courseId: "hist", name: "Unit 1 Exam", dueAt: "2026-02-06T11:00:00-08:00", points: 75, type: "exam", difficulty: "HARD", minutes: 360, isMajor: true, status: "not_started", reason: "Exams are 25% of the course grade." },
  { id: "bio-lab-1", courseId: "bio", name: "Microscope Lab Report", dueAt: "2026-01-27T23:59:00-08:00", points: 45, type: "lab", difficulty: "MEDIUM", minutes: 150, isMajor: false, status: "in_progress", reason: "Lab reports build the 25% lab category." },
  { id: "chem-hw-4", courseId: "chem", name: "Chemistry Homework 4", dueAt: "2026-01-21T23:59:00-08:00", points: 10, type: "homework", difficulty: "EASY", minutes: 40, isMajor: false, status: "not_started", reason: "Low points and standard homework format." },
  { id: "eng-reading", courseId: "eng", name: "Reading Check 4", dueAt: "2026-01-21T23:59:00-08:00", points: 8, type: "quiz", difficulty: "EASY", minutes: 25, isMajor: false, status: "not_started", reason: "Low-point check for completion." },
  { id: "hist-response", courseId: "hist", name: "Weekly Response 3", dueAt: "2026-01-22T23:59:00-08:00", points: 12, type: "discussion", difficulty: "EASY", minutes: 45, isMajor: false, status: "not_started", reason: "Routine weekly response." }
];

const groupWeights = {
  "bio-midterm": 30,
  "eng-paper": 45,
  "hist-exam": 25,
  "bio-lab-1": 25
};

let activeAssignments = mockAssignments;
let activeCourses = mockCourses;
let linkedSnapshot = null;
let statusDismissed = false;

function daysUntil(dateString) {
  const due = new Date(dateString);
  if (Number.isNaN(due.getTime())) return 14;
  const ms = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) - Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  return Math.ceil(ms / 86400000);
}

function priorityFor(assignment) {
  const days = daysUntil(assignment.dueAt);
  const isMajor = assignment.isMajor || /midterm|exam|final|paper|project|presentation/.test(assignment.type);
  const urgency = days < 0 ? 100 : isMajor ? (days <= 7 ? 82 : days <= 30 ? 52 : days <= 45 ? 35 : 15) : days <= 1 ? 78 : days <= 3 ? 58 : 20;
  const gradeImpact = Math.min(100, assignment.points * 0.55 + (groupWeights[assignment.id] || 0) * 1.2 + (isMajor ? 18 : 0));
  const difficulty = { EASY: 18, MEDIUM: 45, HARD: 72, MAJOR: 92 }[assignment.difficulty] || 45;
  const progressRisk = assignment.status === "not_started" ? 70 : 35;
  const score = Math.round(urgency * 0.25 + gradeImpact * 0.3 + difficulty * 0.2 + (isMajor ? 85 : 25) * 0.15 + progressRisk * 0.1);
  let alert = "Plan Ahead";
  if (!isMajor && assignment.difficulty === "EASY" && days <= 3) alert = "Quick Win";
  else if (isMajor && days <= 30) alert = "Major Deadline";
  else if (days <= 7) alert = "Focus This Week";
  else if (score >= 60) alert = "Start Soon";
  return { score, alert, days };
}

function courseName(id) {
  return activeCourses.find((course) => course.id === id)?.name || "Canvas";
}

function shortDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Canvas";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function toneFor(alert) {
  if (alert === "Quick Win") return "green";
  if (alert === "Major Deadline" || alert === "Start Soon") return "amber";
  if (alert === "Due Soon" || alert === "Overdue") return "red";
  return "blue";
}

function estimateCanvasDifficulty(item) {
  const text = `${item.title} ${item.type}`.toLowerCase();
  if (/midterm|final|exam|project|portfolio/.test(text)) return "MAJOR";
  if (/research|paper|essay|presentation/.test(text)) return "HARD";
  if (/quiz|lab|problem/.test(text)) return "MEDIUM";
  return "EASY";
}

function parseCanvasDate(dueText) {
  if (!dueText) return "";
  const withYear = /\d{4}/.test(dueText) ? dueText : `${dueText}, 2026`;
  const parsed = new Date(withYear);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function canvasAssignmentsFromSnapshot(snapshot) {
  const courseId = "linked-canvas";
  return (snapshot.assignmentLinks || []).map((item, index) => {
    const difficulty = estimateCanvasDifficulty(item);
    const isMajor = difficulty === "HARD" || difficulty === "MAJOR";
    return {
      id: `canvas-${index}`,
      courseId: item.courseId || courseId,
      courseName: item.courseName || "Canvas Course",
      name: item.title,
      href: item.href,
      dueAt: item.dueAt || parseCanvasDate(item.dueText),
      points: item.pointsPossible || (isMajor ? 80 : 15),
      type: item.type,
      difficulty,
      minutes: difficulty === "MAJOR" ? 480 : difficulty === "HARD" ? 240 : difficulty === "MEDIUM" ? 90 : 35,
      isMajor,
      status: "not_started",
      reason: item.source === "api"
        ? "Pulled from your logged-in Canvas account."
        : item.dueText ? `Pulled from Canvas. Visible due date: ${item.dueText}.` : "Pulled from the currently linked Canvas page."
    };
  });
}

function card(assignment) {
  const priority = priorityFor(assignment);
  const openLink = assignment.href ? `<a class="open-link" href="${assignment.href}" target="_blank" rel="noreferrer">Open in Canvas</a>` : "";
  return `
    <article class="card">
      <div class="card-header">
        <div>
          <p class="course">${assignment.courseName || courseName(assignment.courseId)}</p>
          <h2 class="title">${assignment.name}</h2>
        </div>
        <span class="badge ${toneFor(priority.alert)}">${priority.alert}</span>
      </div>
      <div class="meta">
        <span>${assignment.difficulty}</span>
        <span>${Math.round(assignment.minutes / 60 * 10) / 10}h</span>
        <span>${assignment.dueAt ? `Due ${shortDate(assignment.dueAt)}` : "Due date hidden"}</span>
        <span>${assignment.points} pts est.</span>
      </div>
      <p class="reason">${assignment.reason}</p>
      <div class="bar" aria-label="Priority ${priority.score} out of 100"><span style="width:${priority.score}%"></span></div>
      ${openLink}
    </article>
  `;
}

function render() {
  const ranked = activeAssignments.map((assignment) => ({ ...assignment, priority: priorityFor(assignment) })).sort((a, b) => b.priority.score - a.priority.score);
  document.querySelector("#focusView").innerHTML = ranked.filter((assignment) => assignment.priority.alert !== "Quick Win").slice(0, 4).map(card).join("") || emptyState("No Canvas work found on this page yet.");
  document.querySelector("#winsView").innerHTML = ranked.filter((assignment) => assignment.priority.alert === "Quick Win").map(card).join("") || emptyState("No quick wins found right now.");
  document.querySelector("#gradesView").innerHTML = activeCourses.map((course) => `
    <article class="grade-card">
      <div class="grade-header">
        <div>
          <p class="course">${course.code}</p>
          <h2 class="title">${course.name}</h2>
        </div>
        <span class="badge ${course.finalGradesHidden ? "amber" : "green"}">${course.finalGradesHidden ? "Estimated" : "Linked"}</span>
      </div>
      ${course.estimatedGrade ? `<p class="score">${course.estimatedGrade}%</p>` : `<p class="grade-state">Grade scan pending</p>`}
      <p class="grade-note">${course.finalGradesHidden ? "Open the Canvas grades page when you want CoursePilot to read visible scores and estimate from syllabus rules." : (course.officialGrade ? `Canvas shows ${course.officialGrade}; CoursePilot estimate is ${course.estimatedGrade}%.` : "Open a Canvas grades page to scan visible grade context.")}</p>
    </article>
  `).join("");
}

function emptyState(message) {
  return `<article class="card"><p class="reason">${message}</p></article>`;
}

function wireTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.add("is-hidden"));
      tab.classList.add("is-active");
      document.querySelector(`#${tab.dataset.view}View`).classList.remove("is-hidden");
    });
  });
}

async function askCanvasScanner(options = {}) {
  const backgroundSnapshot = await askBackgroundToScanCanvas(options);
  if (backgroundSnapshot) return backgroundSnapshot;
  return askActiveCanvasTabToScan();
}

async function askBackgroundToScanCanvas(options = {}) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "COURSEPILOT_SCAN_OPEN_CANVAS_TABS",
      reason: options.force ? "manual-refresh" : "popup-open",
      force: Boolean(options.force)
    });
    return response?.snapshot?.isCanvas ? response.snapshot : null;
  } catch {
    return null;
  }
}

async function askActiveCanvasTabToScan() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:\/\//.test(tab.url || "")) return null;
  const firstTry = await sendScanMessage(tab.id);
  if (firstTry) return firstTry;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch {
    return null;
  }

  return sendScanMessage(tab.id);
}

async function sendScanMessage(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "COURSEPILOT_SCAN_CANVAS" });
    return response?.snapshot?.isCanvas ? response.snapshot : null;
  } catch {
    return null;
  }
}

async function clearStoredCanvasSnapshot() {
  await chrome.storage.local.remove(["coursePilotCanvasSnapshot", "coursePilotLastLinkedCanvas"]);
}

async function loadLinkedCanvas(options = {}) {
  const status = document.querySelector("#canvasStatus");
  if (options.showStatus) statusDismissed = false;
  status.classList.toggle("is-hidden", statusDismissed);
  const freshSnapshot = await askCanvasScanner({ force: Boolean(options.force) });
  const data = await chrome.storage.local.get(["coursePilotCanvasSnapshot", "coursePilotLastLinkedCanvas"]);
  linkedSnapshot = freshSnapshot || data.coursePilotCanvasSnapshot || null;

  if (linkedSnapshot?.baseUrl) {
    const assignments = canvasAssignmentsFromSnapshot(linkedSnapshot);
    activeAssignments = assignments.length ? assignments : mockAssignments;
    const linkedCourses = linkedSnapshot.courses?.length ? linkedSnapshot.courses : coursesFromAssignments(linkedSnapshot.assignmentLinks || []);
    activeCourses = linkedCourses.length ? linkedCourses.map((course) => ({
      id: course.id,
      name: course.name || "Canvas Course",
      code: course.courseCode || "CANVAS",
      finalGradesHidden: true
    })) : [{
      id: "linked-canvas",
      name: linkedSnapshot.courseName || "Linked Canvas Course",
      code: "CANVAS",
      finalGradesHidden: true
    }];
    status.innerHTML = `<span class="status-dot is-live"></span><span>Auto-synced ${linkedSnapshot.assignmentCount || 0} Canvas assignments${formatSyncTime(linkedSnapshot)}.</span><button class="status-close" type="button" title="Dismiss notification">×</button>`;
  } else {
    activeAssignments = mockAssignments;
    activeCourses = mockCourses;
    status.innerHTML = `<span class="status-dot"></span><span>Open Canvas once in any tab; CoursePilot will keep checking automatically.</span><button class="status-close" type="button" title="Dismiss notification">×</button>`;
  }

  render();
}

function coursesFromAssignments(assignments = []) {
  const courses = new Map();
  for (const assignment of assignments) {
    const id = assignment.courseId || "linked-canvas";
    const name = assignment.courseName || "Canvas Course";
    if (!courses.has(id)) courses.set(id, { id, name, courseCode: "CANVAS" });
  }
  return [...courses.values()];
}

function formatSyncTime(snapshot) {
  const dateString = snapshot?.scannedAt || snapshot?.lastSeenAt;
  const date = new Date(dateString || "");
  if (Number.isNaN(date.getTime())) return "";
  const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
  return ` at ${time}`;
}

document.querySelector("#refresh").addEventListener("click", async () => {
  await clearStoredCanvasSnapshot();
  await loadLinkedCanvas({ showStatus: true, force: true });
});
document.querySelector("#canvasStatus").addEventListener("click", (event) => {
  if (!event.target.closest(".status-close")) return;
  statusDismissed = true;
  document.querySelector("#canvasStatus").classList.add("is-hidden");
});
wireTabs();
loadLinkedCanvas({ showStatus: true });
setInterval(() => loadLinkedCanvas(), 60000);
