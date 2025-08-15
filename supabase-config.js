// Supabase Configuration for Perimeter Maintenance Dashboard
// Replace the existing file-based storage with Supabase

const SUPABASE_URL = 'https://itsxxdxyigsyqxkeonqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0c3h4ZHh5aWdzeXF4a2VvbnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDQ1NjgsImV4cCI6MjA2NDg4MDU2OH0.YeWzwqm0FsIBs8ojIdyMSkprWn1OA4SfFgB2DM3j2ko';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table name
const TABLE_NAME = 'perim_customers';

// Export for use in dashboard
window.supabase = supabase;
window.TABLE_NAME = TABLE_NAME;
