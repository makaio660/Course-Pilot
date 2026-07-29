export class CanvasClient {
  constructor(private readonly baseUrl: string, private readonly accessToken?: string) {}

  async listCourses() {
    // TODO: Replace with Canvas REST API call: GET /api/v1/courses.
    throw new Error("Not implemented: connect Canvas OAuth and course sync.");
  }

  async getCourse(courseId: string) {
    // TODO: Fetch Canvas course details and settings, including whether totals are hidden.
    throw new Error(`Not implemented: fetch course ${courseId}.`);
  }

  async listAssignments(courseId: string) {
    // TODO: Fetch assignments and preserve hidden, ungraded, omitted, and locked states.
    throw new Error(`Not implemented: list assignments for ${courseId}.`);
  }

  async listAssignmentGroups(courseId: string) {
    // TODO: Fetch assignment groups and Canvas weights, then reconcile with syllabus weights.
    throw new Error(`Not implemented: list assignment groups for ${courseId}.`);
  }

  async listSubmissions(courseId: string) {
    // TODO: Fetch user submissions, including missing, late, excused, and ungraded states.
    throw new Error(`Not implemented: list submissions for ${courseId}.`);
  }

  async getCourseSettings(courseId: string) {
    // TODO: Use Canvas settings/enrollments to detect hidden final grade totals.
    throw new Error(`Not implemented: get course settings for ${courseId}.`);
  }

  async getSyllabus(courseId: string) {
    // TODO: Fetch syllabus_body and run extraction for dates, weights, and policies.
    throw new Error(`Not implemented: get syllabus for ${courseId}.`);
  }
}
