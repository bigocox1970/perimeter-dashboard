-- Check the actual schema of perim_scaff_systems table
-- Run this in Supabase SQL Editor to see what columns exist

-- Show all columns in the table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'perim_scaff_systems'
ORDER BY ordinal_position;

-- Show a sample of actual data (first 5 on-hire systems)
SELECT *
FROM perim_scaff_systems
WHERE hire_status = 'on-hire'
LIMIT 5;

-- Check if customer_name column already exists
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'perim_scaff_systems'
            AND column_name = 'customer_name'
        )
        THEN 'customer_name column EXISTS'
        ELSE 'customer_name column DOES NOT EXIST'
    END as column_status;

-- Show what fields are populated for on-hire systems
SELECT
    COUNT(*) as total_on_hire,
    COUNT(customer_name) FILTER (WHERE customer_name IS NOT NULL AND customer_name != '') as has_customer_name,
    COUNT(site_contact) FILTER (WHERE site_contact IS NOT NULL AND site_contact != '') as has_site_contact,
    COUNT(address1) FILTER (WHERE address1 IS NOT NULL AND address1 != '') as has_address1,
    COUNT(location) FILTER (WHERE location IS NOT NULL AND location != '') as has_location
FROM perim_scaff_systems
WHERE hire_status = 'on-hire';
