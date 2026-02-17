# Perimeter Dashboard & Phona - Improvements Plan

## Part 1: Perimeter Dashboard (Voice Control)

### Current Problems

1. **Voice Control** - Says "Sorry, I had trouble understanding" 
   - Fix: Use browser-native Web Speech API instead of OpenAI Whisper

2. **Natural Language** - Can't handle "I've just collected P1 from Oxford"
   - Fix: Add more real-world examples to GPT prompt

3. **"What's Changed" Feature** (already implemented in kit-dev)
   - Query scaffold_rental_history for recent changes
   - Returns: "P1 came off hire, P2 went on hire..."

4. **Error Messages** - Too generic
   - Fix: Say "I can help with checking systems on hire, what's changed, updating status..."

5. **Conversation Memory** - No context between commands
   - Fix: Store last 5-10 interactions

---

## Part 2: Phona Marketing Automation

### Goal
Automated marketing flow: Search businesses → Create demo → Send email → Track results

### Building Blocks Already in Codebase
All these already exist:
- `netlify/functions/search-nearby-places.ts` - Google Places API
- `services/demoService.ts` - Create demo assistants
- `services/emailService.ts` - Send emails with templates
- `netlify/functions/get-analytics.ts` - Track views, opens, conversations

### What Needs Building
Orchestration script to wire them together:
1. Search for businesses (location + type)
2. Create personalized demo for each
3. Send outreach email
4. Track analytics

### API Keys Needed
- `GOOGLE_MAPS_API_KEY` - For business search
- `SENDGRID_API_KEY` - For emails (already configured in Phona)

---

## Files & Implementation

### Perimeter Dashboard (kit-dev branch)
- voice-control.js - Browser-native STT + improved prompts
- voice-dashboard-bridge.js - query_recent_changes (done)

### Phona (phona-dev branch)
- New script: `scripts/marketing-automation.ts`
- Run via cron or manual trigger

---

## Testing
- Perimeter: Deploy kit-dev branch → Compare with main
- Phona: Build automation script → Test end-to-end
