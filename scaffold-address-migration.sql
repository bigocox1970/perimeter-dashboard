-- Migration: Add site_address column and split location data from p_number
-- This handles cases where p_number contains "P20 Shrivenham church" instead of just "P20"

-- Step 1: Add the new column
ALTER TABLE perim_scaff_systems
ADD COLUMN IF NOT EXISTS site_address TEXT DEFAULT '';

-- Step 2: Migrate existing data
-- Extract address from p_number field (everything after "P" + digits + optional space)
UPDATE perim_scaff_systems
SET site_address = TRIM(REGEXP_REPLACE(p_number, '^P\d+\s*', '', 'i'))
WHERE p_number ~ '^P\d+\s+.+'  -- Only update rows where p_number has text after the number
  AND (site_address IS NULL OR site_address = '');

-- Step 3: Clean up p_number to only contain the P number (remove the address part)
UPDATE perim_scaff_systems
SET p_number = TRIM(REGEXP_REPLACE(p_number, '^(P\d+)\s+.*', '\1', 'i'))
WHERE p_number ~ '^P\d+\s+.+';  -- Only update rows where p_number has text after the number

-- Step 4: Verify the migration (run this separately to check results)
-- SELECT p_number, site_contact, site_address FROM perim_scaff_systems ORDER BY p_number;

-- Note: After running this migration:
-- - p_number will contain just "P20", "P7", etc.
-- - site_address will contain "Shrivenham church", "St Margarets Church", etc.
-- - site_contact will remain unchanged (should contain the contact name like "michael", "brad", etc.)
