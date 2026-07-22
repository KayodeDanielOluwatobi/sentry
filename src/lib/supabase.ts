import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Single Supabase client shared across the app (auth only — DB stays on Firebase)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
