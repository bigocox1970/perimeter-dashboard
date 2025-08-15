-- Perimeter Maintenance Database Setup
-- This script creates new tables with "perim" prefix to avoid conflicts
-- Run this in your Supabase SQL editor

-- Create the main customers table for perimeter maintenance
CREATE TABLE IF NOT EXISTS perim_customers (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    postcode TEXT NOT NULL,
    system_type TEXT NOT NULL,
    date_installed DATE NOT NULL,
    inspections_per_year INTEGER NOT NULL DEFAULT 1,
    first_inspection_month INTEGER NOT NULL,
    second_inspection_month INTEGER,
    notes TEXT,
    inspection_history JSONB DEFAULT '{"inspection1": [], "inspection2": []}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the id for faster lookups
CREATE INDEX IF NOT EXISTS idx_perim_customers_id ON perim_customers(id);

-- Create an index on inspections_per_year for filtering
CREATE INDEX IF NOT EXISTS idx_perim_customers_inspections_per_year ON perim_customers(inspections_per_year);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_perim_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER trigger_perim_customers_updated_at
    BEFORE UPDATE ON perim_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_perim_customers_updated_at();

-- Enable Row Level Security (optional - for future authentication)
ALTER TABLE perim_customers ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can restrict this later)
CREATE POLICY "Allow all operations on perim_customers" ON perim_customers
    FOR ALL USING (true);

-- Insert some sample data (optional - remove if you don't want sample data)
INSERT INTO perim_customers (
    id, 
    name, 
    address, 
    postcode, 
    system_type, 
    date_installed, 
    inspections_per_year, 
    first_inspection_month, 
    second_inspection_month, 
    notes,
    inspection_history
) VALUES 
(
    1703123456789,
    'ABC Manufacturing Ltd',
    '123 Industrial Estate, Manchester',
    'M1 1AA',
    'HVAC',
    '2020-03-15',
    2,
    3,
    9,
    'Large industrial HVAC system',
    '{"inspection1": [{"date": "2024-03-15", "notes": "Annual inspection completed - all systems operational", "recordedAt": "2024-03-15T10:30:00.000Z"}, {"date": "2023-03-20", "notes": "Routine maintenance - replaced filters", "recordedAt": "2023-03-20T14:15:00.000Z"}], "inspection2": [{"date": "2024-09-10", "notes": "Pre-winter inspection - system ready for cold weather", "recordedAt": "2024-09-10T09:45:00.000Z"}, {"date": "2023-09-05", "notes": "Summer maintenance completed", "recordedAt": "2023-09-05T11:20:00.000Z"}]}'::jsonb
),
(
    1703123456790,
    'XYZ Office Complex',
    '456 Business Park, London',
    'SW1A 1AA',
    'Air Conditioning',
    '2021-06-10',
    1,
    6,
    NULL,
    'Multi-zone AC system',
    '{"inspection1": [{"date": "2024-06-15", "notes": "Annual service - cleaned condenser units", "recordedAt": "2024-06-15T13:30:00.000Z"}, {"date": "2023-06-12", "notes": "Routine inspection - minor adjustments made", "recordedAt": "2023-06-12T10:45:00.000Z"}], "inspection2": []}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create a view for easy querying of inspection statistics
CREATE OR REPLACE VIEW perim_inspection_stats AS
SELECT 
    id,
    name,
    system_type,
    inspections_per_year,
    first_inspection_month,
    second_inspection_month,
    inspection_history->>'inspection1' as inspection1_history,
    inspection_history->>'inspection2' as inspection2_history,
    jsonb_array_length(inspection_history->'inspection1') as inspection1_count,
    jsonb_array_length(inspection_history->'inspection2') as inspection2_count,
    created_at,
    updated_at
FROM perim_customers;

-- Grant necessary permissions
GRANT ALL ON TABLE perim_customers TO anon;
GRANT ALL ON TABLE perim_customers TO authenticated;
GRANT ALL ON TABLE perim_customers TO service_role;

-- Grant permissions on the view
GRANT SELECT ON TABLE perim_inspection_stats TO anon;
GRANT SELECT ON TABLE perim_inspection_stats TO authenticated;
GRANT SELECT ON TABLE perim_inspection_stats TO service_role;

-- Success message
SELECT 'Perimeter Maintenance database setup completed successfully!' as status;
