import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Lumen" },
      { name: "description", content: "Lumen admin panel for managing books, users, and submissions." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminShell,
});