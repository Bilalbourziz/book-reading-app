const DEFAULT_ADMIN_EMAILS = ["admin@example.com"];

export function getAdminEmails(): string[] {
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (!raw?.trim()) return DEFAULT_ADMIN_EMAILS;
  return raw.split(",").map((email) => email.trim()).filter(Boolean);
}

export function isAdmin(email: string | undefined | null): boolean {
  return !!email && getAdminEmails().includes(email);
}
