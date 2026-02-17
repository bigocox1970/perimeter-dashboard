# Perimeter Dashboard - Improvements Plan

## Current Problems

### Voice Control (Priority 1)
- Says "Sorry, I had trouble understanding" - external API calls fail
- Fix: Use browser-native Web Speech API instead of OpenAI Whisper

### Natural Language Understanding
- Can't handle phrases like "I've just collected P1 from High Street"
- Fix: Improve prompt with more real-world examples

### Missing "What's Changed" Feature
- Alex wants: "What's changed in the last 24 hours?"
- Returns: "Systems gone ON hire: P1 to X, Systems OFF hire: P3 from Y"

## Proposed Improvements

### 1. Voice - Browser-Native (No API Keys Needed)
Replace OpenAI Whisper with Web Speech API:
```javascript
// In voice-control.js
const recognition = new webkitSpeechRecognition();
recognition.lang = 'en-GB';
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Process with GPT-4...
};
recognition.start();
```

Keep ElevenLabs for TTS (already works).

### 2. Better Natural Language Parsing
Add more examples to the GPT prompt:
- "I've collected P1 from Oxford" → update_hire_status
- "P1's back in stock" → update_hire_status
- "What's changed this week?" → query_recent_changes

### 3. Add "What's Changed" Feature (Already Implemented in kit-dev)
- New function: query_recent_changes
- Queries scaffold_rental_history table
- Returns summary: "P1 came off hire, P2 went on hire..."

### 4. Better Error Messages
Instead of "I didn't understand", say:
"I'm not sure what you meant. I can help with: checking systems on hire, what's changed recently, updating status like 'P1 is back', or finding info like 'where is P7?'"

### 5. Conversation Memory
Store last 5-10 interactions so user can say "that one" or reference previous context.

## Files to Modify
- voice-control.js - Browser-native STT, improved prompts
- voice-dashboard-bridge.js - query_recent_changes function (already done)
- env-config.js - Remove API key dependencies

## Testing
Deploy to kit-dev branch → Compare with main branch
