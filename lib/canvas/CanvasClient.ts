export type CanvasProfile = {
  id?: number | string;
  name?: string;
  primary_email?: string;
  login_id?: string;
};

export type CanvasCourse = {
  id: number | string;
  name?: string;
  course_code?: string;
  workflow_state?: string;
};

export type CanvasAssignment = {
  id: number | string;
  course_id?: number | string;
  name?: string;
  html_url?: string;
  due_at?: string | null;
  points_possible?: number | null;
};

export class CanvasApiError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
    this.name = "CanvasApiError";
  }
}

export function normalizeCanvasBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new CanvasApiError("Enter your Canvas website URL.", 400);
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new CanvasApiError("Canvas URL must start with http or https.", 400);
  }
  return url.origin;
}

function canvasApiUrl(baseUrl: string, path: string) {
  const url = new URL(path, `${baseUrl}/`);
  if (url.origin !== baseUrl) {
    throw new CanvasApiError("Canvas API path must stay on the linked Canvas website.", 400);
  }
  return url.toString();
}

export class CanvasClient {
  private readonly normalizedBaseUrl: string;

  constructor(
    baseUrl: string,
    private readonly accessToken?: string
  ) {
    this.normalizedBaseUrl = normalizeCanvasBaseUrl(baseUrl);
  }

  get baseUrl() {
    return this.normalizedBaseUrl;
  }

  async getProfile() {
    return this.request<CanvasProfile>("/api/v1/users/self/profile");
  }

  async listCourses() {
    const endpoints = [
      "/api/v1/users/self/favorites/courses?per_page=50&include[]=term",
      "/api/v1/courses?enrollment_state=active&per_page=50&include[]=term"
    ];

    for (const endpoint of endpoints) {
      const courses = await this.request<CanvasCourse[]>(endpoint).catch(() => []);
      if (Array.isArray(courses) && courses.length) return courses;
    }

    return [];
  }

  async getCourse(courseId: string | number) {
    return this.request<CanvasCourse>(`/api/v1/courses/${encodeURIComponent(String(courseId))}`);
  }

  async listAssignments(courseId: string | number) {
    return this.request<CanvasAssignment[]>(
      `/api/v1/courses/${encodeURIComponent(String(courseId))}/assignments?bucket=upcoming&per_page=50&include[]=submission`
    );
  }

  async listAssignmentGroups(courseId: string | number) {
    return this.request(`/api/v1/courses/${encodeURIComponent(String(courseId))}/assignment_groups?per_page=50`);
  }

  async listSubmissions(courseId: string | number) {
    return this.request(`/api/v1/courses/${encodeURIComponent(String(courseId))}/students/submissions?student_ids[]=self&per_page=50`);
  }

  async getCourseSettings(courseId: string | number) {
    return this.request(`/api/v1/courses/${encodeURIComponent(String(courseId))}/settings`);
  }

  async getSyllabus(courseId: string | number) {
    return this.request(`/api/v1/courses/${encodeURIComponent(String(courseId))}?include[]=syllabus_body`);
  }

  private async request<T>(path: string): Promise<T> {
    if (!this.accessToken?.trim()) {
      throw new CanvasApiError("Enter a Canvas access token.", 400);
    }

    const response = await fetch(canvasApiUrl(this.normalizedBaseUrl, path), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      const message = response.status === 401 || response.status === 403
        ? "Canvas rejected that token. Check that it is copied correctly and still active."
        : `Canvas returned ${response.status}. Try again from your school's Canvas URL.`;
      throw new CanvasApiError(message, response.status);
    }

    return response.json() as Promise<T>;
  }
}
