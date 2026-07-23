import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  "https://placeholder.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL && !import.meta.env.SUPABASE_URL) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL is not set in environment variables. Using placeholder client."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
