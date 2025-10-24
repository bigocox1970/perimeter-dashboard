-- Add customer_name column to scaffold systems table
-- This separates "who is hiring the system" from "site contact person"

-- Step 1: Add the new column
ALTER TABLE perim_scaff_systems
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Step 2: Migrate existing data
-- Copy site_contact to customer_name for existing records
UPDATE perim_scaff_systems
SET customer_name = site_contact
WHERE customer_name IS NULL AND site_contact IS NOT NULL;

-- Step 3: For systems that are on-hire, make sure customer_name is populated
UPDATE perim_scaff_systems
SET customer_name = site_contact
WHERE hire_status = 'on-hire' AND (customer_name IS NULL OR customer_name = '');

-- Success message
SELECT 'customer_name column added successfully!' as status;

-- Show summary
SELECT
    COUNT(*) FILTER (WHERE customer_name IS NOT NULL AND customer_name != '') as "Systems with Customer Name",
    COUNT(*) FILTER (WHERE hire_status = 'on-hire') as "On-Hire Systems",
    COUNT(*) as "Total Systems"
FROM perim_scaff_systems;
