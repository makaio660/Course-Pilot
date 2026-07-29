"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Link2, Loader2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";

type CanvasLinkResponse = {
  ok: boolean;
  baseUrl: string;
  profile: {
    id: string;
    name: string;
    email: string;
  };
  courses: Array<{
    id: string;
    name: string;
    courseCode: string;
    state: string;
  }>;
  assignments: Array<{
    id: string;
    courseId: string;
    name: string;
    href: string;
    dueAt: string;
    pointsPossible: number;
  }>;
  assignmentCount: number;
  linkedAt: string;
  error?: string;
};

type StoredCanvasLink = CanvasLinkResponse & {
  accessToken?: string;
  tokenSaved: boolean;
};

const STORAGE_KEY = "coursepilot-website-canvas-link";

export function CanvasWebsiteLinker({ defaultCanvasBaseUrl }: { defaultCanvasBaseUrl: string }) {
  const [baseUrl, setBaseUrl] = useState(defaultCanvasBaseUrl);
  const [accessToken, setAccessToken] = useState("");
  const [rememberToken, setRememberToken] = useState(true);
  const [linked, setLinked] = useState<StoredCanvasLink | null>(null);
  const [status, setStatus] = useState<"idle" | "linking" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as StoredCanvasLink;
    setLinked(parsed);
    setBaseUrl(parsed.baseUrl || defaultCanvasBaseUrl);
    setAccessToken(parsed.accessToken || "");
    setRememberToken(parsed.tokenSaved);
  }, [defaultCanvasBaseUrl]);

  const linkedSummary = useMemo(() => {
    if (!linked) return "Not linked";
    const linkedAt = new Date(linked.linkedAt);
    const date = Number.isNaN(linkedAt.getTime()) ? "" : ` · ${linkedAt.toLocaleDateString()}`;
    return `${linked.profile.name} · ${linked.courses.length} courses · ${linked.assignmentCount} upcoming assignments${date}`;
  }, [linked]);
  const previewAssignments = linked?.assignments?.slice(0, 3) ?? [];

  async function linkCanvas() {
    setStatus("linking");
    setMessage("");

    try {
      const response = await fetch("/api/canvas/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, accessToken })
      });
      const data = await response.json() as CanvasLinkResponse;
      if (!response.ok || !data.ok) throw new Error(data.error || "Canvas could not be linked.");

      const nextLink: StoredCanvasLink = {
        ...data,
        accessToken: rememberToken ? accessToken : "",
        tokenSaved: rememberToken
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLink));
      setLinked(nextLink);
      setStatus("success");
      setMessage("Canvas linked for this website.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Canvas could not be linked.");
    }
  }

  function disconnect() {
    window.localStorage.removeItem(STORAGE_KEY);
    setLinked(null);
    setAccessToken("");
    setStatus("idle");
    setMessage("Canvas disconnected from this browser.");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white/92 p-3 shadow-soft sm:p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Link2 size={18} className="shrink-0 text-pine" />
            <h2 className="text-lg font-semibold text-ink">Canvas website link</h2>
          </div>
          <p className="text-sm text-slate-600">Website-only connection for your Canvas account.</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${linked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {linked ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />}
          {linked ? "Linked" : "Local only"}
        </span>
      </div>

      <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <div className="font-semibold text-ink">{linkedSummary}</div>
        <div className="mt-1 break-all text-xs text-slate-500">{linked?.baseUrl || baseUrl || "Canvas URL not set"}</div>
      </div>

      <div className="grid gap-3 text-sm">
        <label className="grid gap-1">
          Canvas website URL
          <input
            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://canvas.yourschool.edu"
            type="url"
          />
        </label>
        <label className="grid gap-1">
          Canvas access token
          <input
            className="min-h-11 rounded-lg border border-slate-200 px-3 py-2"
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="Paste token"
            type="password"
            autoComplete="off"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-lg bg-mist px-3 py-2">
          <input type="checkbox" checked={rememberToken} onChange={(event) => setRememberToken(event.target.checked)} />
          Save token on this browser
        </label>
      </div>

      {message && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${status === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
          {status === "error" ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <button
          type="button"
          onClick={linkCanvas}
          disabled={status === "linking"}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-pine px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
        >
          {status === "linking" ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
          {linked ? "Refresh Canvas link" : "Link Canvas"}
        </button>
        {linked?.baseUrl && (
          <a href={linked.baseUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            <ExternalLink size={16} /> Open Canvas
          </a>
        )}
        {linked && (
          <button type="button" onClick={disconnect} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            <Unplug size={16} /> Disconnect
          </button>
        )}
      </div>

      {previewAssignments.length > 0 && (
        <div className="mt-4 grid gap-2">
          {previewAssignments.map((assignment) => (
            <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm">
              <span className="min-w-0 break-words font-medium text-ink">{assignment.name}</span>
              <span className="text-xs text-slate-500">{assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : "No due date"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
