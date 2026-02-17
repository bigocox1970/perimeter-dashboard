# Kit's Improvements - kit-dev branch

## Goal
Build an improved voice control system that works more naturally and conversationally.

## Key Improvements Planned

### 1. Enhanced Natural Language Understanding
- More real-world phrases in prompt:
  - "I've just collected P1 from [location]" 
  - "P1's done, take it off hire"
  - "Just picked up the alarm from [address]"
- Better handling of location-based lookups
- Date parsing: "last Thursday", "yesterday", "a week ago"

### 2. Conversation Memory
- Store last 5-10 interactions
- Allow references like "that one", "the church job"
- Remember what was discussed in current session

### 3. "What's Changed" Feature
- New function: query_recent_changes
- Accepts: "last 24 hours", "last 7 days", "today"
- Returns formatted summary for voice output

### 4. Better Error Handling
- When unclear, ask clarifying questions
- Don't fail silently
- Offer suggestions

## Files to Modify
- voice-control.js (main voice logic)
- voice-dashboard-bridge.js (database operations)
- voice-config.example.js (add new config options)

## Testing
Deploy to Netlify as separate site for comparison

## Timeline
- Today: Core improvements
- This evening: Compare with Chris & Alex
