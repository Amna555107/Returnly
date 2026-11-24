// ============================================================
//  supabase.js — Supabase client configuration
//  Replace the two placeholders below with your project values
//  found at: https://supabase.com/dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://aunnrteyghcvxwvhafzk.supabase.co'

const SUPABASE_ANON = 'sb_publishable_15Acw9iWVWlOMPf3WIli_w_yHgLc5XI'

// Initialize Supabase client (loaded from CDN in each HTML file)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
