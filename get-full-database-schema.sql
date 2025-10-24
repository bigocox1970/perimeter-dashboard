-- Get complete database schema - ALL tables and ALL columns
-- This will show the entire structure of your database

-- List all tables in the public schema
SELECT
    'TABLE: ' || table_name as info,
    '' as column_name,
    '' as data_type,
    '' as is_nullable
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- List all columns for all tables in the public schema
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
