// Consistent role colors across the app.
// admin = red; professor = blue; assistant = green; editor = gold; other = accent.

export const ADMIN_COLOR = "#ed4245";

const ROLE_COLORS: Record<string, string> = {
  professor: "#3b82f6",
  assistant: "#3ba55d",
  editor: "#f0b232",
};

export function roleColor(role: string | null | undefined): string {
  return ROLE_COLORS[(role ?? "").trim().toLowerCase()] ?? "var(--accent-medium)";
}
