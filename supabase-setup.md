# Supabase Integration Guide

## Why Supabase?
- ✅ Real-time database updates
- ✅ Automatic data persistence
- ✅ No manual file uploads needed
- ✅ Professional solution
- ✅ Free tier available
- ✅ Built-in authentication (if needed later)

## Setup Steps:

### 1. Create Supabase Account
- Go to https://supabase.com
- Sign up for free account
- Create new project

### 2. Database Schema
```sql
-- Create customers table
CREATE TABLE customers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  system_type TEXT NOT NULL,
  date_installed DATE NOT NULL,
  inspections_per_year INTEGER NOT NULL,
  first_inspection_month INTEGER NOT NULL,
  second_inspection_month INTEGER,
  notes TEXT,
  inspection_history JSONB DEFAULT '{"inspection1": [], "inspection2": []}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (optional)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
```

### 3. Get API Keys
- Go to Settings > API
- Copy your Project URL and anon public key

### 4. Update Dashboard
Replace file-based storage with Supabase API calls.

## Benefits:
- Real-time updates across devices
- Automatic backups
- No manual file management
- Professional database solution
- Scalable for future features
