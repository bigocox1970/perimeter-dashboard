# Scaffold Alarm History Tracking Implementation

## Overview
This implementation adds complete rental history tracking for scaffold alarm systems, allowing you to track when systems are hired and off-hired, who they're rented to, and all associated invoices.

## What's New

### 1. Database Changes
- **New Table**: `scaffold_rental_history` - stores complete history of each rental period
- **Migration File**: `scaffold-rental-history-migration.sql`

### 2. UI Changes

#### New Buttons on Scaffold Tab
- **Off Hire Button** (red) - Shows for on-hire systems
- **On Hire Button** (green) - Shows for off-hire systems
- **View History Button** (📋) - Shows for all systems

#### New Modals
- **Off Hire Modal** - Simple date picker to mark system as off-hire
- **On Hire Modal** - Form to capture customer details when hiring out
- **History Modal** - Timeline view of all rentals with invoice details

### 3. Workflow Changes

#### When Off-Hiring a System:
1. Click "Off Hire" button
2. Select off-hire date (defaults to today)
3. System automatically:
   - Closes current rental history record
   - Updates system status to 'off-hire'
   - Sets address to "In Stock"
   - Preserves all rental data in history

#### When Hiring a System:
1. Click "On Hire" button (only visible for off-hire systems)
2. Fill in customer details:
   - Customer name
   - Site address
   - Contact information
3. System automatically:
   - Creates new rental history record
   - Updates system status to 'on-hire'
   - Sets start date for invoicing

### 4. History View

For each rental period, the history shows:
- **Customer & Location** - Who rented it and where
- **Dates** - When hired and off-hired
- **Duration** - Total days on hire
- **Configuration** - Sensors, ARC status
- **Invoices** - All invoices for that rental with amounts
- **Total Revenue** - Sum of all invoices for that rental

Active rentals are highlighted in green and marked as "Current"

## Installation Steps

### Step 1: Run Database Migration
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Open `scaffold-rental-history-migration.sql`
4. Run the entire script
5. Verify success message appears

### Step 2: Deploy Code Changes
The following files have been updated:
- `app.js` - Added history tracking functions and workflows
- `index.html` - Added new modals for Off Hire, On Hire, and History

Simply refresh your dashboard to see the new features!

## How to Use

### Off-Hiring a System
1. Navigate to Scaffold tab
2. Find the system you want to off-hire
3. Click the red "Off Hire" button
4. Confirm the off-hire date
5. Click "Confirm Off Hire"
6. System is now marked as "In Stock" with history preserved

### Hiring Out a System
1. Navigate to Scaffold tab
2. Find an off-hire system
3. Click the green "On Hire" button
4. Enter customer details and site address
5. Click "Confirm On Hire"
6. New rental history record is created

### Viewing History
1. Click the 📋 button next to any system
2. View complete rental history
3. See all past and current rentals
4. Review invoice history per rental

## Invoice Tracking Integration

### Automatic Tracking
When you update the "Last Invoice Date" field on a system, you can also log it to history by calling:

```javascript
logInvoiceToHistory(systemId, invoiceDate, amount, invoiceNumber)
```

Example:
```javascript
// When you create an invoice for system ID 5
await logInvoiceToHistory(5, '2025-01-15', 400, 'INV-001');
```

### Manual Tracking
You can manually add invoices to the current rental via the browser console if needed.

## Data Structure

### scaffold_rental_history Table
```
- id: Unique rental ID
- system_id: Links to perim_scaff_systems
- p_number: System P number
- hire_date: When rented out
- off_hire_date: When returned (null if still on hire)
- customer_name: Who rented it
- site_address: Where it was installed
- site_contact: On-site contact
- site_phone: Contact phone
- extra_sensors: Configuration at time of rental
- arc_enabled: ARC status
- invoices: JSON array of all invoices [{date, amount, invoice_number}]
- created_at/updated_at: Metadata
```

## Benefits

### For Operations
- **Complete Audit Trail** - Know exactly where every system has been
- **No More Manual Editing** - Proper workflow prevents data loss
- **Customer History** - See all rentals per customer
- **Utilization Tracking** - Calculate downtime between rentals

### For Invoicing
- **Invoice Association** - Each invoice tied to specific rental
- **Revenue Tracking** - See total revenue per rental
- **Historical Records** - Never lose invoice history

### For Analytics
- **Most Profitable Systems** - Track which systems generate most revenue
- **Average Rental Duration** - Calculate typical rental periods
- **Customer Insights** - See repeat customers and patterns

## Optional: Migrate Existing Data

If you have existing on-hire systems and want to create initial history records, uncomment and run the section at the end of the migration SQL file. This will create a history record for each currently on-hire system.

## Troubleshooting

### "No rental history found"
- This is normal for systems that were added before this feature
- History will build up as you use the new Off Hire/On Hire buttons

### Invoices not showing
- Make sure you're calling `logInvoiceToHistory()` when creating invoices
- Check that the system has an active rental (not off-hire)

### Buttons not appearing
- Clear browser cache and refresh
- Check that app.js and index.html are updated

## Future Enhancements

Potential additions:
- Export rental history to PDF/Excel
- Generate invoice reports per rental
- Customer rental history view
- Automatic invoice tracking on date changes
- Analytics dashboard for utilization metrics

## Support

For issues or questions about this feature, check:
1. Browser console for error messages
2. Supabase logs for database errors
3. Verify migration ran successfully

---

✅ **Implementation Complete!** You now have full rental history tracking for all scaffold alarm systems.
