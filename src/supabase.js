import { createClient } from "@supabase/supabase-js";

// Publishable keys are designed for browser use. Database access is protected by RLS.
export const supabase = createClient(
  "https://cwvryyjrqlakmmeuptee.supabase.co",
  "sb_publishable_UuBck1FGxND1pEi7j7uRBw_2uSTz6J4",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
