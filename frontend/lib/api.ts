// All API calls go through the Next.js rewrite proxy (/api/backend/:path* → FastAPI /api/:path*)
// so the browser never calls localhost:8000 directly — works correctly on Replit.
const BASE = "/api/backend";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

export const api = {
  getDashboard: (date?: string) =>
    apiFetch(`/v1/analytics/dashboard${date ? `?date=${date}` : ""}`),

  getTrends: (period = "7d") =>
    apiFetch(`/v1/analytics/trends?period=${period}`),

  getFlight: (flightNumber: string) =>
    apiFetch(`/v1/flights/${flightNumber}`),

  searchFlights: (params: { from?: string; to?: string; date?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/v1/flights/search?${qs}`);
  },

  getBooking: (pnr: string) =>
    apiFetch(`/v1/bookings/${pnr}`),

  getTranscript: (callId: string) =>
    apiFetch(`/v1/voice/transcripts/${callId}`),

  searchTranscripts: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/v1/voice/transcripts/search?${qs}`);
  },

  getTranscriptAnalytics: (period = "7d") =>
    apiFetch(`/v1/voice/transcripts/analytics/summary?period=${period}`),

  // Admin
  getAdminStatus: () => apiFetch(`/v1/admin/status`),
  getAdminConfig: () => apiFetch(`/v1/admin/config`),
  updateAdminConfig: (config: Record<string, unknown>) =>
    apiFetch(`/v1/admin/config`, { method: "PUT", body: JSON.stringify(config) }),
  testLanguage: (message: string, language: string) =>
    apiFetch(`/v1/admin/test-language`, {
      method: "POST",
      body: JSON.stringify({ message, language }),
    }),
  testAllLanguages: (message: string) =>
    apiFetch(`/v1/admin/test-all-languages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  getAdminTools: () => apiFetch(`/v1/admin/tools`),
  testTool: (toolName: string, params: Record<string, unknown> = {}) =>
    apiFetch(`/v1/admin/tools/${toolName}/test`, {
      method: "POST",
      body: JSON.stringify(params),
    }),
  getAdminAnalytics: () => apiFetch(`/v1/admin/analytics`),
  getAdminConversations: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/v1/admin/conversations${qs}`);
  },

  // Interaction grading
  submitGrade: (conversationId: string, grade: number, taskCompleted: boolean, feedback?: string) =>
    apiFetch(`/v1/admin/grade`, {
      method: "POST",
      body: JSON.stringify({ conversation_id: conversationId, grade, task_completed: taskCompleted, feedback }),
    }),
};
