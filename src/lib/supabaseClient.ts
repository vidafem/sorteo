import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_URL no está configurada o no es una URL válida. Define esta variable en Vercel y/o en .env.local."
  );
}

if (!supabaseAnonKey) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada. Define esta variable en Vercel y/o en .env.local."
  );
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;