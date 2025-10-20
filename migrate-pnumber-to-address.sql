-- Migration: Extract location data from p_number into address1
-- This handles cases where p_number contains "P20 Shrivenham church" instead of just "P20"

-- Step 1: Migrate existing data - extract address from p_number field
-- Extract everything after "P" + digits + optional space and put it in address1
UPDATE perim_scaff_systems
SET address1 = TRIM(REGEXP_REPLACE(p_number, '^P\d+\s*', '', 'i'))
WHERE p_number ~ '^P\d+\s+.+'  -- Only update rows where p_number has text after the number
  AND (address1 IS NULL OR address1 = '');

-- Step 2: Clean up p_number to only contain the P number (remove the address part)
UPDATE perim_scaff_systems
SET p_number = TRIM(REGEXP_REPLACE(p_number, '^(P\d+)\s+.*', '\1', 'i'))
WHERE p_number ~ '^P\d+\s+.+';  -- Only update rows where p_number has text after the number

-- Step 3: Verify the migration (run this separately to check results)
-- SELECT p_number, address1, address2, postcode FROM perim_scaff_systems ORDER BY p_number;

-- Note: After running this migration:
-- - p_number will contain just "P20", "P7", etc.
-- - address1 will contain "Shrivenham church", "St Margarets Church", etc.
