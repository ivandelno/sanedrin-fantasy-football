import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vflglznpkjhdstojgvij.supabase.co';
const supabaseAnonKey = 'sb_publishable_ggKnpp3TqtFAMtTE-eu7TA_wAfo9vP3';

// Note: Using the public anon key for client-side access
// Row Level Security (RLS) policies should be configured in Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    db: {
        schema: 'public'
    }
});
