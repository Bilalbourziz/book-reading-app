import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export async function ensureUserProfile(user: User) {
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Reader";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      display_name: displayName,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}
