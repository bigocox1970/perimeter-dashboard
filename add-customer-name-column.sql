-- Add customer_name and location columns to scaffold systems table
-- customer_name: who is hiring the system (company/customer)
-- location: friendly location name for the site

-- Step 1: Add the new columns
ALTER TABLE perim_scaff_systems
ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE perim_scaff_systems
ADD COLUMN IF NOT EXISTS location TEXT;

-- Step 2: Migrate existing data
-- Copy site_contact to customer_name for existing records
UPDATE perim_scaff_systems
SET customer_name = site_contact
WHERE customer_name IS NULL AND site_contact IS NOT NULL;

-- Step 3: For systems that are on-hire, make sure customer_name is populated
UPDATE perim_scaff_systems
SET customer_name = site_contact
WHERE hire_status = 'on-hire' AND (customer_name IS NULL OR customer_name = '');

-- Step 4: Copy address1 to location as a starting point (can be edited later)
UPDATE perim_scaff_systems
SET location = address1
WHERE location IS NULL AND address1 IS NOT NULL AND address1 != '';

-- Success message
SELECT 'customer_name and location columns added successfully!' as status;

-- Show summary
SELECT
    COUNT(*) FILTER (WHERE customer_name IS NOT NULL AND customer_name != '') as "Systems with Customer Name",
    COUNT(*) FILTER (WHERE location IS NOT NULL AND location != '') as "Systems with Location",
    COUNT(*) FILTER (WHERE hire_status = 'on-hire') as "On-Hire Systems",
    COUNT(*) as "Total Systems"
FROM perim_scaff_systems;
