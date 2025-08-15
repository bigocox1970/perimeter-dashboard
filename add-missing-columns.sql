-- Add missing columns to perim_customers table
-- Run this in your Supabase SQL editor

-- Add battery_replacement column
ALTER TABLE perim_customers 
ADD COLUMN IF NOT EXISTS battery_replacement JSONB DEFAULT '{"control_panel": null, "siren": null, "detectors": null}'::jsonb;

-- Add nsi_status column
ALTER TABLE perim_customers 
ADD COLUMN IF NOT EXISTS nsi_status TEXT DEFAULT 'NSI';

-- Add cloud_id column
ALTER TABLE perim_customers 
ADD COLUMN IF NOT EXISTS cloud_id TEXT;

-- Add cloud_renewal_date column
ALTER TABLE perim_customers 
ADD COLUMN IF NOT EXISTS cloud_renewal_date DATE;

-- Add arc_no column
ALTER TABLE perim_customers 
ADD COLUMN IF NOT EXISTS arc_no TEXT;

-- Add arc_renewal_date column
ALTER TABLE perim_customers 
ADD COLUMN IF NOT EXISTS arc_renewal_date DATE;

-- Update existing records to have default values
UPDATE perim_customers 
SET 
    battery_replacement = '{"control_panel": null, "siren": null, "detectors": null}'::jsonb,
    nsi_status = 'NSI'
WHERE battery_replacement IS NULL OR nsi_status IS NULL;
