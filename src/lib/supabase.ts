import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Static client for scripts/simple tests if needed
export const createStaticClient = () => createSupabaseClient(supabaseUrl, supabaseAnonKey);
