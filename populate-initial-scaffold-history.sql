-- Populate initial rental history for existing scaffold systems
-- This creates a rental history record for systems that existed before the history feature was added

-- Create initial rental history records for all currently on-hire systems
INSERT INTO scaffold_rental_history (
  system_id,
  p_number,
  hire_date,
  off_hire_date,
  customer_name,
  site_address,
  site_contact,
  site_phone,
  extra_sensors,
  arc_enabled,
  arc_contact,
  arc_phone,
  app_contact,
  app_phone,
  invoices
)
SELECT
  id,
  p_number,
  COALESCE(start_date, NOW()) as hire_date,
  NULL as off_hire_date,  -- NULL means currently on hire
  COALESCE(site_contact, 'Unknown') as customer_name,
  COALESCE(
    NULLIF(CONCAT_WS(', ',
      NULLIF(address1, ''),
      NULLIF(address2, ''),
      NULLIF(postcode, '')
    ), '')
    , 'No address recorded'
  ) as site_address,
  site_contact,
  site_phone,
  COALESCE(extra_sensors, 0) as extra_sensors,
  COALESCE(arc_enabled, false) as arc_enabled,
  arc_contact,
  arc_phone,
  app_contact,
  app_phone,
  '[]'::jsonb as invoices  -- Empty invoice array for now
FROM perim_scaff_systems
WHERE hire_status = 'on-hire'
  AND id NOT IN (
    -- Don't create duplicates if history already exists
    SELECT DISTINCT system_id
    FROM scaffold_rental_history
    WHERE off_hire_date IS NULL
  );

-- Create closed rental history records for systems that are currently off-hire
-- These will show as completed rentals with unknown off-hire dates
INSERT INTO scaffold_rental_history (
  system_id,
  p_number,
  hire_date,
  off_hire_date,
  customer_name,
  site_address,
  site_contact,
  site_phone,
  extra_sensors,
  arc_enabled,
  arc_contact,
  arc_phone,
  app_contact,
  app_phone,
  invoices
)
SELECT
  id,
  p_number,
  COALESCE(start_date, NOW() - INTERVAL '30 days') as hire_date,
  COALESCE(start_date + INTERVAL '30 days', NOW()) as off_hire_date,  -- Estimate off-hire date
  COALESCE(site_contact, 'Previous Customer') as customer_name,
  'Historical rental - details not recorded' as site_address,
  site_contact,
  site_phone,
  COALESCE(extra_sensors, 0) as extra_sensors,
  COALESCE(arc_enabled, false) as arc_enabled,
  arc_contact,
  arc_phone,
  app_contact,
  app_phone,
  '[]'::jsonb as invoices
FROM perim_scaff_systems
WHERE hire_status = 'off-hire'
  AND id NOT IN (
    -- Don't create duplicates if history already exists
    SELECT DISTINCT system_id
    FROM scaffold_rental_history
  );

-- Show results
SELECT
  'Created ' || COUNT(*) || ' rental history records' as status
FROM scaffold_rental_history;

-- Show breakdown by status
SELECT
  CASE
    WHEN off_hire_date IS NULL THEN 'Active Rentals'
    ELSE 'Completed Rentals'
  END as rental_status,
  COUNT(*) as count
FROM scaffold_rental_history
GROUP BY
  CASE
    WHEN off_hire_date IS NULL THEN 'Active Rentals'
    ELSE 'Completed Rentals'
  END;
