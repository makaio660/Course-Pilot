const CANVAS_AUTOSYNC_ALARM = "coursepilot-canvas-autosync";
const WEEKLY_DIGEST_ALARM = "coursepilot-weekly-digest";
const CANVAS_TAB_REGISTRY_KEY = "coursePilotCanvasTabs";
const CANVAS_HOSTS_KEY = "coursePilotCanvasHosts";
const canvasUrlHints = ["canvas", "instructure.com", "/courses", "/assignments", "/grades", "/calendar", "/login/canvas"];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    coursePilotInstallReady: true,
    weeklyDigestEnabled: true,
    weeklyDigestDay: "Sunday",
    weeklyDigestTime: "7:30 AM",
    digestEmailAddress: ""
  });
  scheduleWeeklyDigest();
  scheduleCanvasAutosync();
  scanOpenCanvasTabs({ reason: "installed" }).catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  scheduleWeeklyDigest();
  scheduleCanvasAutosync();
  scanOpenCanvasTabs({ reason: "startup" }).catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  scanCanvasTabIfLikely({ id: tabId, url: tab.url }, { reason: "tab-updated" }).catch(() => {});
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  scanCanvasTabIfLikely(tab, { reason: "tab-activated" }).catch(() => {});
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get([CANVAS_TAB_REGISTRY_KEY]);
  const registry = data[CANVAS_TAB_REGISTRY_KEY] || {};
  if (!registry[String(tabId)]) return;
  delete registry[String(tabId)];
  await chrome.storage.local.set({ [CANVAS_TAB_REGISTRY_KEY]: registry });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "COURSEPILOT_CANVAS_LINKED") {
    handleCanvasLinked(message, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === "COURSEPILOT_SCAN_OPEN_CANVAS_TABS") {
    scanOpenCanvasTabs({
      reason: message.reason || "popup",
      includePassiveTabs: true,
      allowBroadInjection: Boolean(message.force)
    })
      .then((snapshot) => sendResponse({ ok: true, snapshot }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === "COURSEPILOT_SETTINGS_UPDATED") {
    scheduleWeeklyDigest().then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === WEEKLY_DIGEST_ALARM) {
    await createWeeklyDigestNotification();
    await scheduleWeeklyDigest();
  }

  if (alarm.name === CANVAS_AUTOSYNC_ALARM) {
    await scanOpenCanvasTabs({ reason: "autosync" });
  }
});

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId !== "coursepilot-weekly-digest-ready") return;
  const mailto = await buildWeeklyDigestMailto();
  if (mailto) chrome.tabs.create({ url: mailto });
});

async function handleCanvasLinked(message, sender) {
  const snapshot = message.snapshot?.isCanvas ? message.snapshot : null;
  const baseUrl = message.baseUrl || snapshot?.baseUrl || safeBaseUrl(sender.tab?.url);
  const courseName = message.courseName || snapshot?.courseName || "Canvas";
  const tabId = sender.tab?.id;

  await Promise.all([
    baseUrl ? rememberCanvasHost(baseUrl) : Promise.resolve(),
    rememberCanvasTab({
      tabId,
      url: sender.tab?.url || message.url || snapshot?.url || "",
      baseUrl,
      courseName,
      assignmentCount: snapshot?.assignmentCount || message.assignmentCount || 0
    }),
    snapshot ? storeCanvasSnapshotIfBetter(snapshot) : Promise.resolve()
  ]);

  await chrome.storage.local.set({
    coursePilotLastLinkedCanvas: {
      baseUrl,
      courseName,
      linkedAt: new Date().toISOString(),
      tabId,
      assignmentCount: snapshot?.assignmentCount || message.assignmentCount || 0
    }
  });
}

async function scanOpenCanvasTabs(options = {}) {
  const tabs = await chrome.tabs.query({});
  const [registry, hosts] = await Promise.all([getCanvasTabRegistry(), getRememberedCanvasHosts()]);
  const httpTabs = tabs.filter((tab) => tab?.id && /^https?:\/\//.test(tab.url || ""));

  const likelyTabs = [];
  const passiveTabs = [];
  for (const tab of httpTabs) {
    if (isCanvasCandidateUrl(tab.url, hosts) || registry[String(tab.id)]) {
      likelyTabs.push(tab);
    } else if (options.includePassiveTabs) {
      passiveTabs.push(tab);
    }
  }

  const results = [];
  for (const tab of likelyTabs) {
    const snapshot = await scanCanvasTab(tab, { inject: true, reason: options.reason });
    if (snapshot?.isCanvas) results.push(snapshot);
  }

  for (const tab of passiveTabs) {
    const snapshot = await scanCanvasTab(tab, { inject: Boolean(options.allowBroadInjection), reason: options.reason });
    if (snapshot?.isCanvas) results.push(snapshot);
  }

  const best = chooseBestSnapshot(results);
  if (best) {
    await storeCanvasSnapshotIfBetter(best);
    return best;
  }

  const data = await chrome.storage.local.get(["coursePilotCanvasSnapshot"]);
  return data.coursePilotCanvasSnapshot || null;
}

async function scanCanvasTabIfLikely(tab, options = {}) {
  const hosts = await getRememberedCanvasHosts();
  if (!tab?.id || !isCanvasCandidateUrl(tab.url, hosts)) return null;
  return scanCanvasTab(tab, { inject: true, reason: options.reason });
}

async function scanCanvasTab(tab, options = {}) {
  if (!tab?.id || !/^https?:\/\//.test(tab.url || "")) return null;
  if (options.inject) await injectCanvasScanner(tab.id);

  const snapshot = await sendScanMessage(tab.id);
  if (!snapshot?.isCanvas) return null;

  const savedSnapshot = await storeCanvasSnapshotIfBetter(snapshot);
  await rememberCanvasHost(snapshot.baseUrl);
  await rememberCanvasTab({
    tabId: tab.id,
    url: tab.url,
    baseUrl: snapshot.baseUrl,
    courseName: snapshot.courseName,
    assignmentCount: snapshot.assignmentCount
  });
  return savedSnapshot || snapshot;
}

async function injectCanvasScanner(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch {
    // Protected pages, discarded tabs, and denied host permissions can refuse injection.
  }
}

async function sendScanMessage(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "COURSEPILOT_SCAN_CANVAS" });
    return response?.snapshot?.isCanvas ? response.snapshot : null;
  } catch {
    return null;
  }
}

async function storeCanvasSnapshotIfBetter(candidate) {
  if (!candidate?.isCanvas) return null;
  const data = await chrome.storage.local.get(["coursePilotCanvasSnapshot"]);
  const current = data.coursePilotCanvasSnapshot;
  const snapshot = chooseBetterSnapshot(candidate, current);
  await chrome.storage.local.set({
    coursePilotCanvasSnapshot: snapshot,
    coursePilotCanvasBaseUrl: snapshot.baseUrl
  });
  if (snapshot.baseUrl) await chrome.storage.sync.set({ canvasBaseUrl: snapshot.baseUrl });
  return snapshot;
}

function chooseBestSnapshot(snapshots = []) {
  return snapshots
    .filter((snapshot) => snapshot?.isCanvas)
    .sort((a, b) => snapshotScore(b) - snapshotScore(a))[0] || null;
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

async function rememberCanvasHost(baseUrl) {
  const host = hostnameFromUrl(baseUrl);
  if (!host) return;
  const data = await chrome.storage.local.get([CANVAS_HOSTS_KEY]);
  const hosts = Array.isArray(data[CANVAS_HOSTS_KEY]) ? data[CANVAS_HOSTS_KEY] : [];
  const nextHosts = [host, ...hosts.filter((item) => item !== host)].slice(0, 10);
  await chrome.storage.local.set({ [CANVAS_HOSTS_KEY]: nextHosts });
}

async function getRememberedCanvasHosts() {
  const data = await chrome.storage.local.get([CANVAS_HOSTS_KEY]);
  return Array.isArray(data[CANVAS_HOSTS_KEY]) ? data[CANVAS_HOSTS_KEY] : [];
}

async function rememberCanvasTab(tabInfo = {}) {
  if (!tabInfo.tabId) return;
  const data = await chrome.storage.local.get([CANVAS_TAB_REGISTRY_KEY]);
  const registry = data[CANVAS_TAB_REGISTRY_KEY] || {};
  const now = new Date().toISOString();

  registry[String(tabInfo.tabId)] = {
    tabId: tabInfo.tabId,
    url: tabInfo.url || "",
    baseUrl: tabInfo.baseUrl || "",
    courseName: tabInfo.courseName || "Canvas",
    assignmentCount: tabInfo.assignmentCount || 0,
    lastSeenAt: now
  };

  const freshRegistry = Object.fromEntries(
    Object.entries(registry).filter(([, entry]) => {
      const age = Date.now() - Date.parse(entry.lastSeenAt || 0);
      return Number.isNaN(age) || age < 48 * 60 * 60 * 1000;
    })
  );
  await chrome.storage.local.set({ [CANVAS_TAB_REGISTRY_KEY]: freshRegistry });
}

async function getCanvasTabRegistry() {
  const data = await chrome.storage.local.get([CANVAS_TAB_REGISTRY_KEY]);
  return data[CANVAS_TAB_REGISTRY_KEY] || {};
}

function isCanvasCandidateUrl(url = "", rememberedHosts = []) {
  if (!/^https?:\/\//.test(url)) return false;
  const value = url.toLowerCase();
  const host = hostnameFromUrl(url);
  if (host && rememberedHosts.includes(host)) return true;
  return canvasUrlHints.some((hint) => value.includes(hint));
}

function safeBaseUrl(url = "") {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

function hostnameFromUrl(url = "") {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function scheduleCanvasAutosync() {
  chrome.alarms.create(CANVAS_AUTOSYNC_ALARM, {
    delayInMinutes: 1,
    periodInMinutes: 5
  });
}

async function scheduleWeeklyDigest() {
  const settings = await chrome.storage.sync.get(["weeklyDigestEnabled", "weeklyDigestDay", "weeklyDigestTime"]);
  await chrome.alarms.clear(WEEKLY_DIGEST_ALARM);
  if (settings.weeklyDigestEnabled === false) return;
  chrome.alarms.create(WEEKLY_DIGEST_ALARM, {
    when: nextWeeklyRun(settings.weeklyDigestDay || "Sunday", settings.weeklyDigestTime || "7:30 AM"),
    periodInMinutes: 7 * 24 * 60
  });
}

async function createWeeklyDigestNotification() {
  const settings = await chrome.storage.sync.get(["digestEmailAddress"]);
  const data = await chrome.storage.local.get(["coursePilotCanvasSnapshot"]);
  const count = data.coursePilotCanvasSnapshot?.assignmentCount || 0;
  const email = settings.digestEmailAddress || "your saved email";

  chrome.notifications.create("coursepilot-weekly-digest-ready", {
    type: "basic",
    iconUrl: "icon.svg",
    title: "CoursePilot weekly overview",
    message: `${count} Canvas assignments are ready for your rundown to ${email}. Click to open the email draft.`
  });
}

async function buildWeeklyDigestMailto() {
  const settings = await chrome.storage.sync.get(["digestEmailAddress"]);
  const data = await chrome.storage.local.get(["coursePilotCanvasSnapshot"]);
  const to = settings.digestEmailAddress;
  if (!to) return "";

  const assignments = data.coursePilotCanvasSnapshot?.assignmentLinks || [];
  const topItems = assignments.slice(0, 8).map((assignment, index) => {
    const due = assignment.dueText || (assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : "due date not shown");
    return `${index + 1}. ${assignment.title} (${due})`;
  });
  const body = [
    "Here is your CoursePilot weekly overview:",
    "",
    topItems.length ? topItems.join("\n") : "No Canvas assignments were found in the latest scan.",
    "",
    "Open Canvas for the full assignment details."
  ].join("\n");

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent("CoursePilot weekly overview")}&body=${encodeURIComponent(body)}`;
}

function nextWeeklyRun(dayName, time) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const targetDay = Math.max(0, days.indexOf(dayName));
  const now = new Date();
  const target = new Date(now);
  const daysAhead = (targetDay - now.getDay() + 7) % 7 || 7;
  target.setDate(now.getDate() + daysAhead);
  applyTime(target, time);
  return target.getTime();
}

function applyTime(date, time) {
  const match = String(time).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
}
