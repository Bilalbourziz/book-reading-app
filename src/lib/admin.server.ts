const DEFAULT_ADMIN_EMAILS = ["admin@example.com"];

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS;
  if (!raw?.trim()) return DEFAULT_ADMIN_EMAILS;
  return raw.split(",").map((email) => email.trim()).filter(Boolean);
}

export function assertAdmin(email: string | undefined): void {
  if (!email || !getAdminEmails().includes(email)) {
    throw new Error("Forbidden: Admin access required");
  }
}
