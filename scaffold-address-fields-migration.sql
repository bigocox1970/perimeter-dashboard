-- Migration: Add address1, address2, postcode fields
-- This adds three separate address fields for better structure

-- Step 1: Add the new columns
ALTER TABLE perim_scaff_systems
ADD COLUMN IF NOT EXISTS address1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS postcode TEXT DEFAULT '';

-- Step 2: Verify the migration (run this separately to check results)
-- SELECT p_number, address1, address2, postcode FROM perim_scaff_systems ORDER BY p_number;
