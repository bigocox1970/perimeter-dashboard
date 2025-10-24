-- Get the complete schema of perim_scaff_systems table
-- This shows what columns actually exist in the database

-- Show all columns with their data types
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'perim_scaff_systems'
ORDER BY ordinal_position;

-- Show sample data (first 3 rows) to see what's actually stored
SELECT *
FROM perim_scaff_systems
LIMIT 3;
