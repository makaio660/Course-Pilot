if (window.__coursePilotScannerLoaded) {
  window.__coursePilotScanCanvas?.().catch?.(() => {});
} else {
  window.__coursePilotScannerLoaded = true;
  window.__coursePilotLastScanAt = 0;

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function isLikelyCanvasPage() {
  const href = location.href.toLowerCase();
  if (href.includes("instructure.com") || href.includes("canvas.")) return true;
  if (document.querySelector("meta[name='application-name'][content*='Canvas' i], meta[name='apple-mobile-web-app-title'][content*='Canvas' i]")) return true;
  if (window.ENV?.current_user || window.ENV?.COURSE_ID || window.ENV?.ACCOUNT_ID) return true;

  const canvasChrome = document.querySelector("#application, #breadcrumbs, #global_nav_dashboard_link, .ic-app-header, .ic-app-course-menu");
  const canvasLinks = document.querySelector("a[href*='/courses/'], a[href*='/assignments'], a[href*='/grades'], a[href*='/calendar']");
  const sampleText = `${document.title} ${cleanText(document.body?.innerText || "").slice(0, 1500)}`;
  return Boolean((canvasChrome || canvasLinks) && /canvas|dashboard|courses|assignments|grades|syllabus/i.test(sampleText));
}

function detectCourseName() {
  return cleanText(
    document.querySelector(".ic-app-course-menu .ellipsis, .course-title, h1, [data-testid='course-header-title']")?.textContent ||
    document.title.replace(/\|.*/, "")
  );
}

function detectCourseIdFromUrl(url = location.href) {
  try {
    return new URL(url).pathname.match(/\/courses\/(\d+)/)?.[1] || "";
  } catch {
    return String(url).match(/\/courses\/(\d+)/)?.[1] || "";
  }
}

function detectCurrentCourseId() {
  return detectCourseIdFromUrl(location.href) || window.ENV?.COURSE_ID || "";
}

function readNearbyDueDate(link) {
  const row = link.closest("tr, li, .ig-row, .assignment, .context_module_item, .planner-item, [class*='assignment']");
  const text = cleanText(row?.textContent || link.parentElement?.textContent || "");
  const dueMatch = text.match(/due\s+([A-Z][a-z]{2,9}\s+\d{1,2}(?:,\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  return dueMatch?.[1] || "";
}

function classifyAssignment(title = "", href = "") {
  const text = `${title} ${href}`.toLowerCase();
  if (/midterm|final|exam/.test(text)) return "exam";
  if (/research|paper|essay/.test(text)) return "paper";
  if (/project|portfolio/.test(text)) return "project";
  if (/presentation|slides/.test(text)) return "presentation";
  if (/discussion|reply/.test(text)) return "discussion";
  if (/quiz/.test(text)) return "quiz";
  if (/lab/.test(text)) return "lab";
  return "assignment";
}

async function canvasApiJson(path) {
  const response = await fetchCanvasApi(path);
  return response.json;
}

async function fetchCanvasApi(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const url = path.startsWith("http") ? path : `${location.origin}${path}`;

  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) {
      const error = new Error(`Canvas API ${response.status} for ${path}`);
      error.status = response.status;
      throw error;
    }
    return { json: await response.json(), next: nextPageFromLinkHeader(response.headers.get("Link")) };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCanvasPages(path, maxPages = 2) {
  let nextPath = path;
  const results = [];

  for (let page = 0; page < maxPages && nextPath; page += 1) {
    const response = await fetchCanvasApi(nextPath);
    if (!Array.isArray(response.json)) return response.json;
    results.push(...response.json);
    nextPath = response.next;
  }

  return results;
}

function nextPageFromLinkHeader(header = "") {
  const nextLink = header.split(",").find((part) => /rel="?next"?/.test(part));
  return nextLink?.match(/<([^>]+)>/)?.[1] || "";
}

async function fetchCanvasCourses() {
  const endpoints = [
    "/api/v1/users/self/favorites/courses?per_page=50&include[]=term",
    "/api/v1/courses?enrollment_state=active&per_page=50&include[]=term"
  ];
  for (const endpoint of endpoints) {
    try {
      const courses = await fetchCanvasPages(endpoint, 2);
      if (Array.isArray(courses) && courses.length) return courses;
    } catch {
      // Schools can disable favorites, hide concluded courses, or require a different dashboard endpoint.
    }
  }
  return [];
}

async function fetchPlannerAssignments() {
  const items = await fetchCanvasPages("/api/v1/planner/items?per_page=50", 3);
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => {
      const href = item.html_url || item.plannable?.html_url || "";
      return item.plannable_type === "assignment" || href.includes("/assignments/");
    })
    .map(plannerItemToAssignment)
    .filter((item) => item.title);
}

async function fetchUpcomingEventAssignments() {
  const events = await fetchCanvasPages("/api/v1/users/self/upcoming_events?per_page=50", 2);
  if (!Array.isArray(events)) return [];
  return events
    .map(eventToAssignment)
    .filter((item) => item.title && item.href?.includes("/assignments/"));
}

async function fetchCourseAssignments(courses) {
  const currentCourseId = detectCurrentCourseId();
  const targetCourses = currentCourseId
    ? [{ id: currentCourseId, name: detectCourseName() }]
    : courses.slice(0, 8);
  const assignments = [];

  for (const course of targetCourses) {
    const endpoints = [
      `/api/v1/courses/${course.id}/assignments?bucket=upcoming&per_page=50&include[]=submission`,
      `/api/v1/courses/${course.id}/assignments?order_by=due_at&per_page=50&include[]=submission`
    ];

    for (const endpoint of endpoints) {
      try {
        const courseAssignments = await fetchCanvasPages(endpoint, 2);
        if (!Array.isArray(courseAssignments)) continue;
        assignments.push(...courseAssignments.map((assignment) => apiAssignmentToItem(assignment, course)));
      } catch {
        // Keep partial data. The planner/upcoming APIs and visible-page scanner can still help.
      }
    }
  }

  return assignments;
}

async function fetchAssignmentsFromApi() {
  const errors = [];
  let courses = [];
  let assignments = [];

  try {
    courses = await fetchCanvasCourses();
  } catch (error) {
    errors.push(apiErrorLabel("courses", error));
  }

  for (const [label, loader] of [
    ["planner", fetchPlannerAssignments],
    ["upcoming", fetchUpcomingEventAssignments]
  ]) {
    try {
      assignments.push(...await loader());
    } catch (error) {
      errors.push(apiErrorLabel(label, error));
    }
  }

  if (detectCurrentCourseId() || assignments.length < 5) {
    try {
      assignments.push(...await fetchCourseAssignments(courses));
    } catch (error) {
      errors.push(apiErrorLabel("assignments", error));
    }
  }

  assignments = dedupeAssignments(assignments);
  return {
    courses,
    assignments,
    errors,
    apiReachable: courses.length > 0 || assignments.length > 0
  };
}

function apiErrorLabel(label, error) {
  return `${label}:${error?.status || error?.name || "unavailable"}`;
}

function apiAssignmentToItem(assignment, course = {}) {
  return normalizeAssignment({
    canvasId: assignment.id,
    courseId: String(course.id || assignment.course_id || ""),
    courseName: course.name || assignment.context_name || "Canvas Course",
    title: assignment.name,
    href: assignment.html_url || (course.id ? `${location.origin}/courses/${course.id}/assignments/${assignment.id}` : ""),
    dueAt: assignment.due_at || "",
    pointsPossible: assignment.points_possible ?? 0,
    type: classifyAssignment(assignment.name, assignment.html_url || ""),
    source: "api"
  });
}

function plannerItemToAssignment(item) {
  const plannable = item.plannable || {};
  const courseId = courseIdFromContext(item.context_code) || item.course_id || plannable.course_id || detectCourseIdFromUrl(item.html_url || plannable.html_url || "");
  const href = plannable.html_url || item.html_url || (courseId && plannable.id ? `${location.origin}/courses/${courseId}/assignments/${plannable.id}` : "");

  return normalizeAssignment({
    canvasId: plannable.id || item.plannable_id || "",
    courseId: String(courseId || ""),
    courseName: item.context_name || plannable.context_name || "Canvas Course",
    title: plannable.title || plannable.name || item.title || item.name,
    href,
    dueAt: plannable.due_at || item.plannable_date || item.start_at || item.end_at || "",
    pointsPossible: plannable.points_possible ?? 0,
    type: classifyAssignment(plannable.title || plannable.name || item.title, href),
    source: "planner"
  });
}

function eventToAssignment(event) {
  const assignment = event.assignment || {};
  const courseId = courseIdFromContext(event.context_code) || assignment.course_id || detectCourseIdFromUrl(event.html_url || assignment.html_url || "");
  const href = assignment.html_url || event.html_url || (courseId && assignment.id ? `${location.origin}/courses/${courseId}/assignments/${assignment.id}` : "");

  return normalizeAssignment({
    canvasId: assignment.id || event.assignment_id || "",
    courseId: String(courseId || ""),
    courseName: event.context_name || assignment.context_name || "Canvas Course",
    title: assignment.name || assignment.title || event.title,
    href,
    dueAt: assignment.due_at || event.start_at || event.end_at || "",
    pointsPossible: assignment.points_possible ?? 0,
    type: classifyAssignment(assignment.name || event.title, href),
    source: "calendar"
  });
}

function courseIdFromContext(contextCode = "") {
  return String(contextCode).match(/course_(\d+)/)?.[1] || "";
}

function scanVisibleAssignmentLinks() {
  return [...document.querySelectorAll("a[href*='/assignments/']:not([href*='/assignments/syllabus'])")]
    .map((link) => normalizeAssignment({
      title: cleanText(link.textContent),
      href: link.href,
      dueText: readNearbyDueDate(link),
      courseId: detectCourseIdFromUrl(link.href),
      courseName: detectCourseName(),
      type: classifyAssignment(link.textContent, link.href),
      source: "page"
    }))
    .filter((item) => item.title && !/^(assignments?|grades?|syllabus|modules?)$/i.test(item.title))
    .slice(0, 50);
}

async function scanCanvasPage() {
  window.__coursePilotLastScanAt = Date.now();
  if (!isLikelyCanvasPage()) {
    return { isCanvas: false, url: location.href, title: document.title, assignmentCount: 0, assignmentLinks: [] };
  }

  const baseUrl = `${location.protocol}//${location.host}`;
  const courseName = detectCourseName();
  const apiResult = await fetchAssignmentsFromApi().catch((error) => ({
    courses: [],
    assignments: [],
    errors: [apiErrorLabel("scan", error)],
    apiReachable: false
  }));
  const visibleAssignments = scanVisibleAssignmentLinks();
  const mergedAssignments = dedupeAssignments([...apiResult.assignments, ...visibleAssignments]).slice(0, 100);

  const syllabusLinks = [...document.querySelectorAll("a[href*='/assignments/syllabus'], a[href$='/assignments/syllabus'], a[href*='/syllabus']")]
    .map((link) => ({ title: cleanText(link.textContent) || "Syllabus", href: link.href }))
    .slice(0, 5);

  const gradeLinks = [...document.querySelectorAll("a[href*='/grades']")]
    .map((link) => ({ title: cleanText(link.textContent) || "Grades", href: link.href }))
    .slice(0, 5);

  const snapshot = {
    isCanvas: true,
    url: location.href,
    baseUrl,
    title: document.title,
    courseName,
    currentCourseId: detectCurrentCourseId(),
    courses: apiResult.courses.map((course) => ({ id: String(course.id), name: course.name, courseCode: course.course_code || "" })),
    assignmentCount: mergedAssignments.length,
    apiAssignmentCount: apiResult.assignments.length,
    visibleAssignmentCount: visibleAssignments.length,
    assignmentLinks: mergedAssignments,
    syllabusLinks,
    gradeLinks,
    scanErrors: apiResult.errors,
    scanSource: apiResult.apiReachable ? "canvas-api" : "visible-page",
    scannedAt: new Date().toISOString()
  };

  const storedSnapshot = await storeBestCanvasSnapshot(snapshot);
  chrome.runtime.sendMessage({
    type: "COURSEPILOT_CANVAS_LINKED",
    baseUrl,
    courseName,
    url: location.href,
    assignmentCount: storedSnapshot.assignmentCount,
    snapshot: storedSnapshot
  }).catch(() => {});
  return storedSnapshot;
}

async function storeBestCanvasSnapshot(candidate) {
  const data = await chrome.storage.local.get(["coursePilotCanvasSnapshot"]);
  const snapshot = chooseBetterSnapshot(candidate, data.coursePilotCanvasSnapshot);
  await chrome.storage.local.set({ coursePilotCanvasSnapshot: snapshot, coursePilotCanvasBaseUrl: snapshot.baseUrl });
  await chrome.storage.sync.set({ canvasBaseUrl: snapshot.baseUrl });
  return snapshot;
}

function chooseBetterSnapshot(candidate, current) {
  if (!current?.isCanvas) return candidate;
  if (candidate.baseUrl && current.baseUrl && candidate.baseUrl !== current.baseUrl) {
    return assignmentCount(candidate) > 0 ? candidate : current;
  }

  const candidateCount = assignmentCount(candidate);
  const currentCount = assignmentCount(current);
  const currentAge = Date.now() - Date.parse(current.scannedAt || current.lastSeenAt || 0);
  const keepCurrentWithHeartbeat = {
    ...current,
    lastSeenAt: candidate.scannedAt || new Date().toISOString(),
    lastSeenUrl: candidate.url || current.lastSeenUrl || current.url
  };

  if (candidateCount === 0 && currentCount > 0 && currentAge < 24 * 60 * 60 * 1000) {
    return keepCurrentWithHeartbeat;
  }

  return snapshotScore(candidate) >= snapshotScore(current) ? candidate : keepCurrentWithHeartbeat;
}

function snapshotScore(snapshot) {
  const count = assignmentCount(snapshot);
  const apiCount = Number(snapshot?.apiAssignmentCount || 0);
  const courseCount = Array.isArray(snapshot?.courses) ? snapshot.courses.length : 0;
  const scannedAt = Date.parse(snapshot?.scannedAt || snapshot?.lastSeenAt || 0);
  const freshness = Number.isNaN(scannedAt) ? 0 : Math.max(0, 1000 - Math.floor((Date.now() - scannedAt) / 60000));
  return count * 100 + apiCount * 25 + courseCount * 4 + freshness / 1000;
}

function assignmentCount(snapshot) {
  return Number(snapshot?.assignmentCount || snapshot?.assignmentLinks?.length || 0);
}

function normalizeAssignment(item = {}) {
  const title = cleanText(item.title || item.name || "");
  const href = item.href || "";
  const dueAt = item.dueAt || "";

  return {
    canvasId: item.canvasId || "",
    courseId: String(item.courseId || ""),
    courseName: item.courseName || "Canvas Course",
    title,
    href,
    dueAt,
    dueText: item.dueText || formatDueDate(dueAt),
    pointsPossible: Number(item.pointsPossible || 0),
    type: item.type || classifyAssignment(title, href),
    source: item.source || "api"
  };
}

function dedupeAssignments(items = []) {
  const assignments = new Map();
  for (const item of items.map(normalizeAssignment)) {
    if (!item.title || item.href.includes("/assignments/syllabus")) continue;
    const key = assignmentKey(item);
    const existing = assignments.get(key);
    assignments.set(key, mergeAssignment(existing, item));
  }
  return [...assignments.values()].sort((a, b) => dueSortValue(a) - dueSortValue(b));
}

function assignmentKey(item) {
  if (item.canvasId && item.courseId) return `${item.courseId}:${item.canvasId}`;
  const href = item.href.replace(location.origin, "").replace(/[?#].*/, "");
  if (href) return href.toLowerCase();
  return `${item.courseId}:${item.title.toLowerCase()}`;
}

function mergeAssignment(existing, candidate) {
  if (!existing) return candidate;
  const merged = { ...existing };
  for (const [key, value] of Object.entries(candidate)) {
    if (value !== "" && value !== null && value !== undefined && value !== 0) {
      merged[key] = value;
    }
  }
  merged.source = [...new Set([existing.source, candidate.source].filter(Boolean).join("+").split("+"))].join("+");
  return merged;
}

function dueSortValue(item) {
  const time = Date.parse(item.dueAt || "");
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function formatDueDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function injectStatusPill(snapshot) {
  if (!snapshot.isCanvas || document.querySelector("#coursepilot-status-pill")) return;
  const pill = document.createElement("div");
  pill.id = "coursepilot-status-pill";
  pill.textContent = `CoursePilot synced ${snapshot.assignmentCount || 0} assignments`;
  pill.style.position = "fixed";
  pill.style.right = "16px";
  pill.style.bottom = "16px";
  pill.style.zIndex = "2147483647";
  pill.style.padding = "9px 12px";
  pill.style.border = "1px solid #d9e2ec";
  pill.style.borderRadius = "8px";
  pill.style.background = "#ffffff";
  pill.style.color = "#1f2933";
  pill.style.boxShadow = "0 12px 28px rgba(31, 41, 51, 0.14)";
  pill.style.font = "600 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  document.body.appendChild(pill);
  setTimeout(() => pill.remove(), 3500);
}

window.__coursePilotScanCanvas = scanCanvasPage;

scanCanvasPage()
  .then(injectStatusPill)
  .catch((error) => console.warn("CoursePilot Canvas scan failed", error));

setInterval(() => {
  if (Date.now() - window.__coursePilotLastScanAt < 55000) return;
  scanCanvasPage().catch(() => {});
}, 60000);

let mutationTimer;
const observer = new MutationObserver(() => {
  clearTimeout(mutationTimer);
  mutationTimer = setTimeout(() => scanCanvasPage().catch(() => {}), 1500);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "COURSEPILOT_SCAN_CANVAS") return false;
  scanCanvasPage()
    .then((snapshot) => sendResponse({ ok: true, snapshot }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true;
});
}
