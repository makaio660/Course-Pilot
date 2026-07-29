import { NextResponse } from "next/server";
import { CanvasApiError, CanvasClient, type CanvasAssignment, type CanvasCourse, type CanvasProfile } from "@/lib/canvas/CanvasClient";

type LinkRequest = {
  baseUrl?: string;
  accessToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as LinkRequest;
    const client = new CanvasClient(String(body.baseUrl || ""), String(body.accessToken || ""));
    const [profile, courses] = await Promise.all([
      client.getProfile(),
      client.listCourses()
    ]);

    const assignmentGroups = await Promise.all(
      courses.slice(0, 8).map((course) => client.listAssignments(course.id).catch(() => [] as CanvasAssignment[]))
    );
    const assignments = assignmentGroups.flat();

    return NextResponse.json({
      ok: true,
      baseUrl: client.baseUrl,
      profile: sanitizeProfile(profile),
      courses: courses.map(sanitizeCourse),
      assignments: assignments.slice(0, 50).map(sanitizeAssignment),
      assignmentCount: assignments.length,
      linkedAt: new Date().toISOString()
    });
  } catch (error) {
    const status = error instanceof CanvasApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Could not link Canvas right now.";
    return NextResponse.json({ ok: false, error: message }, { status: status >= 400 && status < 600 ? status : 500 });
  }
}

function sanitizeProfile(profile: CanvasProfile) {
  return {
    id: profile.id ? String(profile.id) : "",
    name: profile.name || "Canvas student",
    email: profile.primary_email || profile.login_id || ""
  };
}

function sanitizeCourse(course: CanvasCourse) {
  return {
    id: String(course.id),
    name: course.name || course.course_code || "Canvas Course",
    courseCode: course.course_code || "CANVAS",
    state: course.workflow_state || ""
  };
}

function sanitizeAssignment(assignment: CanvasAssignment) {
  return {
    id: String(assignment.id),
    courseId: assignment.course_id ? String(assignment.course_id) : "",
    name: assignment.name || "Canvas assignment",
    href: assignment.html_url || "",
    dueAt: assignment.due_at || "",
    pointsPossible: assignment.points_possible || 0
  };
}
