-- Add hire_status column to scaffold alarm systems table
-- Run this in your Supabase SQL editor

-- Add hire_status column to the perim_scaff_systems table
-- Based on the database schema and scaff tab code
ALTER TABLE perim_scaff_systems 
ADD COLUMN IF NOT EXISTS hire_status TEXT DEFAULT 'on-hire';

-- Add a constraint to ensure only valid hire statuses are used
-- Values match what the scaff tab expects: 'on-hire' and 'off-hire'
ALTER TABLE perim_scaff_systems 
ADD CONSTRAINT chk_perim_scaff_systems_hire_status 
CHECK (hire_status IN ('on-hire', 'off-hire'));

-- Create an index for faster filtering by hire status
CREATE INDEX IF NOT EXISTS idx_perim_scaff_systems_hire_status ON perim_scaff_systems(hire_status);

-- Update existing records to have default 'on-hire' status if NULL
UPDATE perim_scaff_systems 
SET hire_status = 'on-hire' 
WHERE hire_status IS NULL;

-- Success message
SELECT 'Hire status column added successfully to perim_scaff_systems table!' as status;