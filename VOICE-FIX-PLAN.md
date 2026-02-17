# Voice Control Issues - Analysis & Fix Plan

## Current Problem
Voice control says "Sorry, I had trouble understanding that" even with API keys configured.

## Root Causes Identified

### 1. API Keys Not Being Read
The code tries to read from `voice-config.js` file, but:
- On Netlify, environment variables should be used
- The `env-config.js` loads defaults, not the actual Netlify env vars

### 2. Code Issue in voice-control.js
The code has TWO error messages - one was fixed but the main error happens earlier in the flow when:
- Audio recording starts but fails to get transcript
- The error "Sorry, I had trouble understanding that" is a fallback when transcription fails

## What Needs Fixing

### Option A: Debug why API calls are failing
1. Add console.log statements to see if OPENAI_API_KEY is being read
2. Check if the fetch calls to OpenAI are actually happening
3. Check browser DevTools → Console for errors

### Option B: Simplify the voice stack
Use browser-native APIs instead of external APIs:
- Use **Web Speech API** (built into Chrome/Safari) for speech-to-text
- Use **browser SpeechSynthesis** for voice output

This removes dependency on OpenAI/ElevenLabs entirely and should work immediately.

## Recommended Fix (Option B)

Replace the external API calls with browser-native alternatives:

### For Speech-to-Text:
```javascript
// Use browser's built-in speech recognition
const recognition = new webkitSpeechRecognition();
recognition.lang = 'en-GB';
recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Process transcript...
};
recognition.start();
```

### For Text-to-Speech:
```javascript
// Use browser's built-in TTS
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'en-GB';
speechSynthesis.speak(utterance);
```

## Next Steps
1. Ask Claude in Cursor to implement browser-native voice
2. This will work without any API keys
3. Test and verify

## Files to Modify
- `voice-control.js` - Replace Whisper with Web Speech API
- Keep ElevenLabs for TTS (works fine)
