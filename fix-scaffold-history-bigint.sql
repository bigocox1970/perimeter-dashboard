-- Fix: Change system_id to BIGINT to support timestamp-based IDs
-- Run this migration to fix the "value out of range for type integer" error

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE scaffold_rental_history
DROP CONSTRAINT IF EXISTS scaffold_rental_history_system_id_fkey;

-- Step 2: Change system_id column type to BIGINT
ALTER TABLE scaffold_rental_history
ALTER COLUMN system_id TYPE BIGINT;

-- Step 3: Also ensure perim_scaff_systems.id is BIGINT (if it isn't already)
ALTER TABLE perim_scaff_systems
ALTER COLUMN id TYPE BIGINT;

-- Step 4: Recreate the foreign key constraint
ALTER TABLE scaffold_rental_history
ADD CONSTRAINT scaffold_rental_history_system_id_fkey
FOREIGN KEY (system_id) REFERENCES perim_scaff_systems(id) ON DELETE CASCADE;

-- Success message
SELECT 'scaffold_rental_history.system_id changed to BIGINT successfully!' as status;
