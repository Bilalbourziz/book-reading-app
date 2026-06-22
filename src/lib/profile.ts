import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures a profile row exists. Only tries once per session.
 * First checks if a row exists, only attempts INSERT if not found.
 * This avoids the upsert hitting RLS issues.
 */
let guaranteeAttempted = false;

export async function ensureProfileExistsOnce(user: User) {
  if (guaranteeAttempted) return;
  guaranteeAttempted = true;

  // First check if profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  // Profile already exists — nothing to do
  if (existing) return;

  // Profile doesn't exist — try to insert one.
  // Use the display name from metadata or email.
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Reader";

  // Try a simple INSERT. If RLS blocks it, that's fine — the user will
  // just see a generic avatar initially. The trigger handle_new_user
  // should have already created the row on signup anyway.
  await supabase.from("profiles").insert({
    id: user.id,
    display_name: displayName,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }).then(() => {}).catch(() => {});
}

export async function ensureUserProfile(user: User) {
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Reader";

  // Only upsert avatar_url if it exists in metadata, otherwise leave it alone
  const upsertData: Record<string, any> = {
    id: user.id,
    email: user.email ?? null,
    display_name: displayName,
  };

  if (user.user_metadata?.avatar_url) {
    upsertData.avatar_url = user.user_metadata.avatar_url;
  }

  const { error } = await supabase.from("profiles").upsert(
    upsertData,
    { onConflict: "id" },
  );

  if (error) throw error;
}
