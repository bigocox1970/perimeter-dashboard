# Voice Control Refactor: OpenAI Function Calling

## Overview
Refactor voice control from hardcoded pattern matching to intelligent OpenAI function calling, allowing the AI to handle question variations automatically without writing code for every possible phrasing.

## Current System Problems
- AI just routes to predefined actions (glorified if/else)
- Need to hardcode every question variation
- `analyze_data` has pattern matching (`if question.includes('nsi')`)
- Not scalable - every new question type needs code changes
- AI doesn't see actual data, can't reason intelligently

## New System Benefits
- AI intelligently picks functions and parameters
- Handle unlimited question variations automatically
- Much cleaner, more maintainable code
- Easy to add new capabilities (just define function schema)
- AI can analyze actual data context

## Implementation Plan

### **PHASE 1: Setup & Testing (Steps 1-5)**
**Goal:** Build new system alongside old one, zero breaking changes

#### Step 1: Research OpenAI Function Calling
- Read OpenAI docs on function calling API
- Understand function schema format
- Note down examples for our use case
- Document how to handle function responses

**Key Concepts:**
```javascript
// Function definition format
{
  name: "function_name",
  description: "What this function does",
  parameters: {
    type: "object",
    properties: {
      param1: { type: "string", description: "..." },
      param2: { type: "number", description: "..." }
    },
    required: ["param1"]
  }
}
```

#### Step 2: Create New processCommandWithFunctions() Method
- Add new method in `voice-control.js`
- Keep existing `processCommand()` unchanged
- New method uses OpenAI function calling format
- Returns same result structure as old method

**Location:** `voice-control.js` line ~464

#### Step 3: Add Feature Flag
- Add `USE_FUNCTION_CALLING: false` to `env-config.js`
- Update `processCommand()` to check flag:
  ```javascript
  if (envConfig.getBool('USE_FUNCTION_CALLING')) {
    return await this.processCommandWithFunctions(transcript);
  }
  // Existing code continues here...
  ```
- Can toggle between old/new system anytime

#### Step 4: Define 3 Simple Function Schemas
Start with simplest queries as proof of concept:

**Functions to define:**
1. `count_scaffold_on_hire` - Count systems on hire
2. `count_scaffold_off_hire` - Count systems off hire
3. `count_total_customers` - Count all maintenance customers

**Example schema:**
```javascript
{
  name: "count_scaffold_on_hire",
  description: "Count how many scaffold alarm systems are currently on hire",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
}
```

#### Step 5: Test Simple Queries
- Set `USE_FUNCTION_CALLING: true`
- Test:
  - "How many systems on hire?"
  - "How many scaffold alarms in stock?"
  - "How many customers do I have?"
- Verify results match old system
- If anything fails, toggle flag to `false` and debug

**Rollback:** Set `USE_FUNCTION_CALLING: false`

---

### **PHASE 2: Build Out Query Functions (Steps 6-9)**
**Goal:** Define all query functions with intelligent parameters

#### Step 6: Maintenance Query Functions
Define functions for maintenance queries with smart parameters:

**Functions:**
1. `check_maintenance_due` - with timeframe parameter
   ```javascript
   parameters: {
     timeframe: {
       type: "string",
       description: "Timeframe to check: 'this month', 'next month', 'November', etc.",
       enum: ["this month", "next month", "January", "February", ..., "December"]
     }
   }
   ```

2. `count_overdue_inspections` - Count overdue inspections

3. `list_customers_by_nsi_status` - Filter by NSI/Non-NSI
   ```javascript
   parameters: {
     nsi_status: {
       type: "string",
       enum: ["NSI", "Non-NSI", "all"]
     },
     calculate_inspections: {
       type: "boolean",
       description: "Whether to calculate total inspections per year"
     }
   }
   ```

**Benefits:** AI automatically extracts "November" from question, no hardcoding needed

#### Step 7: Scaffold System Query Functions
Define scaffold-specific queries:

**Functions:**
1. `search_scaffold_systems` - Search by location/building type
   ```javascript
   parameters: {
     search_term: { type: "string", description: "Location, building type, or address" },
     exclude: { type: "boolean", description: "True for 'outside Oxford', false for 'in Oxford'" },
     hire_status: { type: "string", enum: ["on-hire", "off-hire", "all"] }
   }
   ```

2. `get_system_info` - Get specific system details
   ```javascript
   parameters: {
     p_number: { type: "string", description: "P number like 'P7', 'P20'" }
   }
   ```

3. `locate_system` - Find where system is located
   ```javascript
   parameters: {
     p_number: { type: "string" }
   }
   ```

4. `calculate_revenue` - Calculate revenue
   ```javascript
   parameters: {
     timeframe: { type: "string", enum: ["weekly", "monthly", "yearly"] }
   }
   ```

#### Step 8: Smart analyze_data Function
**Major improvement:** Instead of pattern matching, send actual data context

**Old way (bad):**
```javascript
if (question.includes('nsi') && question.includes('maintenance')) {
  // hardcoded logic
}
```

**New way (smart):**
```javascript
{
  name: "analyze_data",
  description: "Analyze business data to answer complex questions",
  parameters: {
    question: { type: "string", description: "The analytical question to answer" },
    data_context: {
      type: "object",
      description: "Relevant data snapshot for analysis",
      properties: {
        customer_stats: { type: "object" },
        scaffold_stats: { type: "object" },
        monthly_breakdown: { type: "object" }
      }
    }
  }
}
```

**Implementation:**
- Prepare data snapshot (counts, stats, breakdowns)
- Send to AI as context
- Let AI analyze and respond based on actual data
- Can answer ANY question about the data without new code

**Example data context:**
```javascript
{
  customers: {
    total: 83,
    nsi: 12,
    non_nsi: 71,
    total_inspections_per_year: 15,
    nsi_inspections_per_year: 15
  },
  scaffolds: {
    total: 20,
    on_hire: 12,
    off_hire: 8,
    weekly_revenue: 2400,
    monthly_revenue: 9600
  },
  monthly_maintenance: {
    January: 2,
    February: 3,
    // ... etc
  }
}
```

#### Step 9: Full Query Testing
Test all query types extensively:

**Maintenance queries:**
- "How many maintenance due this month?"
- "Any inspections in November?"
- "How many NSI customers?"
- "Total inspections per year for NSI?"

**Scaffold queries:**
- "How many on hire?"
- "Where is P20?"
- "Systems in Oxford"
- "Systems outside Oxford"
- "Church buildings"
- "Monthly revenue"

**Analytical queries:**
- "Busiest month for maintenance?"
- "Average revenue per system?"
- "How many maintenance do I do for NSI customers each year?"

**Verify:**
- All questions answered correctly
- Parameters extracted intelligently
- Results match old system
- Question variations work (don't need exact phrasing)

**Rollback:** Set `USE_FUNCTION_CALLING: false` if issues

---

### **PHASE 3: Add Modification Functions (Steps 10-11)**
**Goal:** Handle data modifications safely

#### Step 10: Define Modification Functions
**CAUTION:** These change data, test carefully!

**Functions:**

1. `update_hire_status` - Change system hire status
   ```javascript
   parameters: {
     identifier: {
       type: "object",
       properties: {
         p_number: { type: "string" },
         location: { type: "string" }
       }
     },
     new_status: { type: "string", enum: ["on-hire", "off-hire"] },
     off_hire_date: { type: "string", description: "Date when went off hire (natural language ok)" }
   }
   ```

2. `add_scaffold_system` - Install new system
   ```javascript
   parameters: {
     p_number: { type: "string", required: true },
     site_contact: { type: "string", required: true },
     app_contact: { type: "string", required: true },
     address: { type: "string" },
     extra_sensors: { type: "number", default: 0 },
     arc_enabled: { type: "boolean", default: false }
   }
   ```

3. `update_system_details` - Update any system field
   ```javascript
   parameters: {
     p_number: { type: "string" },
     location: { type: "string" },
     updates: {
       type: "object",
       properties: {
         site_contact: { type: "string" },
         app_contact: { type: "string" },
         address: { type: "string" },
         phone: { type: "string" }
       }
     }
   }
   ```

4. `mark_inspection_complete` - Complete maintenance inspection
   ```javascript
   parameters: {
     customer_name: { type: "string", required: true },
     inspection_date: { type: "string" },
     notes: { type: "string" }
   }
   ```

**Multi-step conversations:**
- AI can ask for missing required fields
- "I need the customer name to mark inspection complete"
- More natural back-and-forth

#### Step 11: Test Modifications Carefully
**IMPORTANT:** Test on non-production data first!

**Test cases:**
- "Change P1 to off hire"
- "The one at Oxford has come off hire"
- "Put P7 back on hire"
- "Update P9 site contact to John Smith"
- "Mark inspection complete for [customer]"

**Verify:**
- Data changes correctly in database
- Can handle variations ("change", "update", "set", "mark as")
- Missing info prompts user appropriately
- No data corruption

**Safety checks:**
- Confirm before destructive operations
- Validate all parameters before database update
- Log all modifications for audit trail

**Rollback:** Set `USE_FUNCTION_CALLING: false` if issues

---

### **PHASE 4: Cutover & Cleanup (Steps 12-15)**
**Goal:** Make new system default, remove old code

#### Step 12: Enable New System by Default
- Set `USE_FUNCTION_CALLING: true` in config
- Keep old code as fallback for emergency
- Monitor for any issues

**Monitoring:**
- Check voice command logs for failures
- Watch for any "I don't understand" responses
- Verify data integrity

#### Step 13: Extensive Real-World Testing
Use system normally for several days:

**Test variety:**
- Different phrasings of same question
- Complex analytical questions
- Edge cases
- Multi-step conversations
- Modifications with missing data

**Success criteria:**
- 95%+ success rate (check voice logs)
- No data corruption
- Handles variations well
- Faster/more natural than old system

#### Step 14: Remove Old Switch Statement
Once confident (at least 1 week of stable use):

**Remove from voice-control.js:**
- Old `processCommand()` switch statement (~lines 754-838)
- All hardcoded action handlers:
  - `count_on_hire`, `count_off_hire`, `count_in_stock`
  - `list_in_stock`, `calculate_monthly_revenue`, etc.
  - `check_maintenance_due`, `count_overdue_inspections`
  - `count_total_customers`, `count_nsi_customers`
  - All the stubs returning "not yet connected"

**Remove from voice-dashboard-bridge.js:**
- Pattern matching in `analyzeData()` (~lines 192-305)
- All the hardcoded `if (question.includes(...))` blocks

**Keep:**
- All the actual implementation functions (just call them from function handlers)
- Database query logic
- Data validation

**Estimated removal:** ~500 lines of unnecessary code

#### Step 15: Clean Up System Prompt
**Remove from system prompt:**
- Long list of "AVAILABLE ACTIONS" (~30 lines)
- Hardcoded examples for every action (~20 lines)
- Intent/action/parameters JSON structure

**Add to system prompt:**
- Brief description: "Use the available functions to query and modify data"
- General guidelines for natural conversation
- Parameter extraction best practices

**Result:** System prompt shrinks from ~150 lines to ~30 lines

---

## Files to Modify

### Primary Files
1. **voice-control.js** (~1350 lines)
   - Add `processCommandWithFunctions()` method
   - Add function schema definitions
   - Add function handlers
   - Remove old switch statement (later)
   - Clean up system prompt (later)

2. **voice-dashboard-bridge.js** (~700 lines)
   - Keep implementation functions
   - Remove pattern matching from `analyzeData()` (later)
   - Add data context preparation for smart analysis

3. **env-config.js** (~120 lines)
   - Add `USE_FUNCTION_CALLING: false` flag (step 3)
   - Change to `true` in step 12

### Files to Test
4. **voice-command-logger.js** - ensure logging still works
5. **voice-log-ui.js** - ensure UI displays correctly

---

## Safety & Rollback

### At Each Phase
- **Phase 1-2:** Set `USE_FUNCTION_CALLING: false` to revert
- **Phase 3:** Test modifications on backup data first
- **Phase 4:** Keep old code for 1 week before deleting

### Rollback Procedure
1. Set `USE_FUNCTION_CALLING: false` in env-config.js
2. Git push
3. Hard refresh browser
4. Old system takes over immediately

### Git Strategy
- Create commits after each major step
- Tag stable points: `v1-function-calling-phase-1`, etc.
- Can `git revert` to any stable point

---

## Testing Checklist

### After Each Phase
- [ ] Simple counts work (on hire, off hire, customers)
- [ ] Maintenance queries work (with timeframes)
- [ ] Scaffold queries work (search, locate)
- [ ] Analytical questions work (busiest month, revenue, NSI)
- [ ] Modifications work (hire status, system details)
- [ ] Multi-step conversations work
- [ ] Voice command logs show success
- [ ] No database corruption
- [ ] No regression in existing functionality

### Question Variations to Test
Try asking the same thing different ways:

**"How many on hire?"**
- "How many systems are on hire?"
- "Count of scaffold alarms on hire"
- "Tell me the on-hire count"
- "What's the on-hire number?"

**"Where is P20?"**
- "Locate P20"
- "Find P20"
- "What's the location of P20?"
- "Tell me where P20 is"

**"NSI inspections per year?"**
- "How many maintenance for NSI customers each year?"
- "Total inspections per year for NSI approved systems"
- "NSI annual maintenance count"
- "How much maintenance do I do for NSI?"

All variations should work without code changes!

---

## Success Metrics

### Before (Current System)
- ❌ Need code for each question variation
- ❌ ~500 lines of hardcoded pattern matching
- ❌ Can't handle unexpected phrasings
- ❌ Adding new capability requires coding

### After (Function Calling)
- ✅ Unlimited question variations automatically
- ✅ ~100 lines of clean function definitions
- ✅ Handles natural language variations
- ✅ New capabilities = just define function schema
- ✅ AI sees actual data, can reason intelligently
- ✅ Much more maintainable

---

## Timeline Estimate

- **Phase 1:** 2-3 hours (setup + simple testing)
- **Phase 2:** 3-4 hours (define all query functions)
- **Phase 3:** 2-3 hours (modifications + careful testing)
- **Phase 4:** 1-2 hours (cutover) + 1 week (monitoring) + 1 hour (cleanup)

**Total:** ~8-12 hours of work + 1 week monitoring

---

## Notes

- Work incrementally, test after each step
- Keep old system working until 100% confident
- Don't rush Phase 3 (modifications) - test thoroughly
- Monitor voice logs obsessively during Phase 4
- Get good sleep before starting! 😴

---

## Resources

- [OpenAI Function Calling Docs](https://platform.openai.com/docs/guides/function-calling)
- [Function Calling Best Practices](https://cookbook.openai.com/examples/how_to_call_functions_with_chat_models)
- Voice command logs: Dashboard > Logs tab

---

**Ready to start tomorrow!** 🚀
