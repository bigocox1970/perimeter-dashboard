-- Migration: Create scaffold_rental_history table for tracking rental history
-- This enables proper tracking of when systems are hired/off-hired and to whom

-- Step 1: Create the rental history table
CREATE TABLE IF NOT EXISTS scaffold_rental_history (
  id SERIAL PRIMARY KEY,
  system_id BIGINT REFERENCES perim_scaff_systems(id) ON DELETE CASCADE,
  p_number TEXT NOT NULL,

  -- Rental period
  hire_date TIMESTAMP NOT NULL,
  off_hire_date TIMESTAMP,

  -- Customer & location info
  customer_name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  site_contact TEXT,
  site_phone TEXT,

  -- System configuration during this rental
  extra_sensors INTEGER DEFAULT 0,
  arc_enabled BOOLEAN DEFAULT FALSE,
  arc_contact TEXT,
  arc_phone TEXT,
  app_contact TEXT,
  app_phone TEXT,

  -- Invoice tracking for this rental period
  -- Structure: [{"date": "2024-01-15", "amount": 400, "status": "paid", "invoice_number": "INV-001"}]
  invoices JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_scaffold_history_system_id ON scaffold_rental_history(system_id);
CREATE INDEX IF NOT EXISTS idx_scaffold_history_p_number ON scaffold_rental_history(p_number);
CREATE INDEX IF NOT EXISTS idx_scaffold_history_hire_date ON scaffold_rental_history(hire_date);
CREATE INDEX IF NOT EXISTS idx_scaffold_history_active ON scaffold_rental_history(system_id, off_hire_date)
  WHERE off_hire_date IS NULL;

-- Step 3: Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_scaffold_rental_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_scaffold_rental_history_updated_at
    BEFORE UPDATE ON scaffold_rental_history
    FOR EACH ROW
    EXECUTE FUNCTION update_scaffold_rental_history_updated_at();

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE scaffold_rental_history ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy (allow all operations for authenticated users)
CREATE POLICY "Enable all operations for authenticated users" ON scaffold_rental_history
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 7: Grant permissions
GRANT ALL ON scaffold_rental_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE scaffold_rental_history_id_seq TO authenticated;

-- Success message
SELECT 'Scaffold rental history table created successfully!' as status;

-- Optional: Migrate existing on-hire systems to create their initial history records
-- This creates a rental history record for each currently on-hire system
-- Uncomment and customize dates as needed:

/*
INSERT INTO scaffold_rental_history (
  system_id,
  p_number,
  hire_date,
  customer_name,
  site_address,
  site_contact,
  site_phone,
  extra_sensors,
  arc_enabled,
  arc_contact,
  arc_phone,
  app_contact,
  app_phone
)
SELECT
  id,
  p_number,
  COALESCE(start_date, NOW()) as hire_date,
  COALESCE(site_contact, 'Unknown') as customer_name,
  COALESCE(site_address, '') as site_address,
  site_contact,
  site_phone,
  COALESCE(extra_sensors, 0) as extra_sensors,
  COALESCE(arc_enabled, false) as arc_enabled,
  arc_contact,
  arc_phone,
  app_contact,
  app_phone
FROM perim_scaff_systems
WHERE hire_status = 'on-hire';
*/
