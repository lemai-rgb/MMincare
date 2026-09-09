import { createClient } from "@/lib/supabase/client";

// Compatibility export for existing imports. New code should call createClient.
export const supabase = createClient();
