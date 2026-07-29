const fields = [
  "canvasBaseUrl",
  "alertSensitivity",
  "importanceThreshold",
  "dailyDigest",
  "weeklyDigestEnabled",
  "digestEmailAddress",
  "weeklyDigestDay",
  "weeklyDigestTime",
  "countMissing"
];

async function load() {
  const saved = await chrome.storage.sync.get(fields);
  const local = await chrome.storage.local.get(["coursePilotLastLinkedCanvas", "coursePilotCanvasSnapshot"]);
  for (const field of fields) {
    const element = document.querySelector(`#${field}`);
    if (!element || saved[field] === undefined) continue;
    if (element.type === "checkbox") element.checked = Boolean(saved[field]);
    else element.value = saved[field];
  }
  const linked = local.coursePilotLastLinkedCanvas || local.coursePilotCanvasSnapshot;
  if (linked?.baseUrl) {
    document.querySelector("#linkedStatus").textContent = `Linked to ${linked.baseUrl}${linked.courseName ? ` · ${linked.courseName}` : ""}`;
    if (!saved.canvasBaseUrl) document.querySelector("#canvasBaseUrl").value = linked.baseUrl;
  }
}

async function save() {
  const settings = {};
  for (const field of fields) {
    const element = document.querySelector(`#${field}`);
    settings[field] = element.type === "checkbox" ? element.checked : element.value;
  }
  await chrome.storage.sync.set(settings);
  await chrome.runtime.sendMessage({ type: "COURSEPILOT_SETTINGS_UPDATED" }).catch(() => {});
  document.querySelector("#status").textContent = "Saved.";
}

async function openWeeklyDraft() {
  const settings = {};
  for (const field of fields) {
    const element = document.querySelector(`#${field}`);
    if (!element) continue;
    settings[field] = element.type === "checkbox" ? element.checked : element.value;
  }
  const local = await chrome.storage.local.get(["coursePilotCanvasSnapshot"]);
  const assignments = local.coursePilotCanvasSnapshot?.assignmentLinks || [];
  const body = [
    "Here is your CoursePilot weekly overview:",
    "",
    ...(assignments.length ? assignments.slice(0, 8).map((assignment, index) => `${index + 1}. ${assignment.title} (${assignment.dueText || "due date not shown"})`) : ["No Canvas assignments were found in the latest scan."]),
    "",
    `Schedule: ${settings.weeklyDigestDay || "Sunday"} at ${settings.weeklyDigestTime || "7:30 AM"}`
  ].join("\n");
  const to = settings.digestEmailAddress || "";
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent("CoursePilot weekly overview")}&body=${encodeURIComponent(body)}`;
}

document.querySelector("#save").addEventListener("click", save);
document.querySelector("#openWeeklyDraft").addEventListener("click", openWeeklyDraft);
load();
