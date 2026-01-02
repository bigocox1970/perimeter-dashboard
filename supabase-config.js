// Supabase Configuration for Perimeter Maintenance Dashboard
// Replace the existing file-based storage with Supabase

const SUPABASE_URL = 'https://crqmwitgctyukozlxjhc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YUM82zfmFRRh-O_hlcjbpA_0xJ0jniO';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table name
const TABLE_NAME = 'perim_customers';

// Export for use in dashboard
window.supabase = supabase;
window.TABLE_NAME = TABLE_NAME;
