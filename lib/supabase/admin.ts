import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

let cachedAdminClient: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> {
  if (cachedAdminClient) return cachedAdminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase URL or Service Role key env vars");
  }
  cachedAdminClient = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedAdminClient;
}
