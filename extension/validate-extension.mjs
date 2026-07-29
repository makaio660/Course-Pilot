import { existsSync, readFileSync } from "node:fs";
import { Script } from "node:vm";

const manifest = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8"));
const required = ["manifest_version", "name", "version", "action", "permissions", "content_scripts"];

for (const key of required) {
  if (!manifest[key]) throw new Error(`Missing manifest key: ${key}`);
}

if (manifest.manifest_version !== 3) {
  throw new Error("CoursePilot extension must use Manifest V3.");
}

if (manifest.action.default_popup !== "popup.html") {
  throw new Error("Expected popup.html as the default popup.");
}

if (manifest.background?.service_worker !== "background.js") {
  throw new Error("Expected background.js as the service worker.");
}

if (!manifest.host_permissions?.includes("https://*/*")) {
  throw new Error("Expected broad host permission so custom school Canvas domains can connect.");
}

if (!manifest.permissions?.includes("scripting")) {
  throw new Error("Expected scripting permission so the popup can refresh the Canvas scanner in already-open tabs.");
}

for (const file of ["popup.html", "popup.js", "content.js", "background.js", "options.html"]) {
  if (!existsSync(new URL(`./${file}`, import.meta.url))) {
    throw new Error(`Missing extension file: ${file}`);
  }
}

for (const permission of ["alarms", "notifications", "scripting"]) {
  if (!manifest.permissions?.includes(permission)) {
    throw new Error(`Expected ${permission} permission.`);
  }
}

for (const file of ["popup.js", "content.js", "background.js", "options.js"]) {
  const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
  new Script(source, { filename: file });
}

console.log("CoursePilot Chrome extension manifest looks good.");
