// SPA mode - use import.meta.env for Vite
export function getAdminEmails(): string[] {
  const raw = typeof import.meta !== 'undefined' 
    ? (import.meta.env.VITE_ADMIN_EMAILS as string || "")
    : "";
  if (!raw?.trim()) return ["admin@example.com"];
  return raw.split(",").map((email) => email.trim()).filter(Boolean);
}

export function assertAdmin(email: string | undefined): void {
  if (!email || !getAdminEmails().includes(email)) {
    throw new Error("Forbidden: Admin access required");
  }
}