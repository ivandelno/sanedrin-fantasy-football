import { createClient } from '@supabase/supabase-js';

// Support both Vite (import.meta.env) and Node.js (process.env)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
    || process.env.VITE_SUPABASE_URL
    || 'https://vflglznpkjhdstojgvij.supabase.co';

const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
    || process.env.VITE_SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbGdsem5wa2poZHN0b2pndmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MjI5NTYsImV4cCI6MjA0ODQ5ODk1Nn0.vOCBhkWDWJLJhFqtEyZ_Aw3bNRQSNGbP4kPPwGdCvKk';

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
