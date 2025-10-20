# 🎤 Voice Control Guide

## Overview

Your Perimeter Dashboard now has full two-way voice control powered by OpenAI Whisper (Speech-to-Text), GPT-4 (Natural Language Understanding), and ElevenLabs (Text-to-Speech).

## Getting Started

### 1. API Keys Setup

**Local Development:**
Copy `voice-config.example.js` to `voice-config.js` and add your API keys:
```javascript
OPENAI_API_KEY: 'sk-proj-...',
ELEVENLABS_API_KEY: 'sk_...'
```

**Production (Netlify):**
Add environment variables in Netlify dashboard:
- `OPENAI_API_KEY` - Required
- `ELEVENLABS_API_KEY` - Optional (falls back to browser TTS)

### 2. Using Voice Control

1. **Look for the microphone button** - Bottom right corner (purple/gradient circle)
2. **Hold to speak** - Press and hold the mic button while speaking
3. **Release to process** - Let go when done speaking
4. **Wait for processing** - Audio is sent to OpenAI Whisper for transcription
5. **Listen to response** - The assistant speaks back using ElevenLabs TTS

**Note:** Hold-to-talk interface works on both desktop and mobile browsers.

## Supported Commands

### 📊 Query Commands (Get Information)

#### Scaffold Systems

- "How many systems do we have on hire?"
- "How many systems are off hire?"
- "What's the total monthly revenue?"
- "What's the total weekly revenue?"
- "Tell me about P14"
- "What's the status of P1?"
- "Show me information for P7"

#### Maintenance Customers

- "How many customers do we have?"
- "How many NSI customers do we have?"
- "How many inspections are overdue?"
- "Show me overdue inspections"

### ✏️ Modification Commands (Change Data)

#### Update Hire Status

- "Change P1 to off hire"
- "Set P14 status to on hire"
- "Update P7 to off hire"
- "Mark P3 as off hire"

#### Update Contact Numbers

- "Change the ARC contact number for P14 to 07904685409"
- "Update the site phone number for P1 to 07123456789"
- "Set the app contact for P7 to 07999888777"

#### Complete Inspections

- "Mark [customer name] inspection as complete"
- "Complete the inspection for [customer name]"

### 🧭 Navigation Commands

- "Switch to scaff tab"
- "Go to maintenance"
- "Show me NSI"
- "Open complaints"

## Visual Feedback

### Microphone Button Colors

- **Purple Gradient** - Ready to use
- **Pink/Red Pulsing** - Listening to your voice
- **Blue Spinning** - Processing/thinking
- **Green** - Executing command
- **Orange/Yellow** - Speaking response
- **Red Shake** - Error occurred

### Status Indicator

A small bubble appears above the mic button showing:
- "Listening..."
- "Processing..."
- "Understanding..."
- "Executing command..."
- "Speaking..."

### Transcript Display

Shows what you said after speaking (appears at bottom center of screen)

### Response Display

Shows what the assistant is saying back to you

## Tips for Best Results

### 🎯 Be Clear and Specific

✅ **Good**: "Change P1 to off hire"
❌ **Unclear**: "Update that thing"

✅ **Good**: "What's the monthly revenue?"
❌ **Unclear**: "How much money?"

### 🗣️ Speak Naturally

The AI understands natural variations:
- "How many systems on hire?" = "How many systems are currently on hire?" = "Count on hire systems"
- "What's P1 status?" = "Tell me about P1" = "Show me P1 information"

### 🔊 Audio Quality & Transcription

- Use in a quiet environment
- Speak clearly at normal volume
- Hold button **before** you start speaking and **release after** you finish
- **Speak in phrases, not single words** - "How many systems on hire?" works better than "hello"
- Longer queries are more accurately transcribed than short greetings
- Don't speak too fast
- If transcription is incorrect, try speaking louder and more clearly

### 🔄 Confirmations

For modification commands, the system will:
1. Acknowledge what you want to do
2. Ask for confirmation (if enabled)
3. Execute the change
4. Confirm completion

## Configuration Options

Edit `.env` to customize behavior:

### Voice Recognition

```env
VOICE_LANGUAGE=en-GB                    # British English
VOICE_CONFIDENCE_THRESHOLD=0.7          # How confident STT must be
VOICE_MAX_RECORDING_DURATION=30         # Max seconds per recording
```

### Voice Response

```env
TTS_PROVIDER=elevenlabs                 # or 'browser'
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel voice
TTS_SPEECH_RATE=1.0                     # Speed (0.1-10)
TTS_SPEECH_PITCH=1.0                    # Pitch (0-2)
TTS_SPEECH_VOLUME=1.0                   # Volume (0-1)
```

### Available ElevenLabs Voices

```env
# Female Voices
21m00Tcm4TlvDq8ikWAM  # Rachel - Calm, clear
EXAVITQu4vr4xnSDxMaL  # Bella - Professional

# Male Voices
ErXwobaYiN019PkySvjV  # Antoni - Professional
VR6AewLTigWG4xSOukaG  # Arnold - Deep
```

### Feature Flags

```env
VOICE_REQUIRE_CONFIRMATION=true         # Confirm before changes
ENABLE_CONVERSATION_CONTEXT=true        # Remember conversation
ENABLE_MOBILE_VOICE=true                # Enable on mobile devices
ENABLE_VOICE_FEEDBACK=true              # Speak responses
VOICE_DEBUG_MODE=false                  # Console logging
```

## Troubleshooting

### No microphone access

**Problem**: Browser asks for microphone permission but it's denied

**Solution**:
1. Click the 🔒 lock icon in browser address bar
2. Allow microphone access
3. Refresh the page

### Voice not recognized

**Problem**: "I had trouble understanding that"

**Solutions**:
- Check internet connection (needs to call OpenAI API)
- Speak louder or more clearly
- Reduce background noise
- Check `.env` has correct `OPENAI_API_KEY`

### No voice response

**Problem**: Assistant doesn't speak back

**Solutions**:
- Check `ENABLE_VOICE_FEEDBACK=true` in `.env`
- Check `ELEVENLABS_API_KEY` is correct
- Try browser TTS: Set `TTS_PROVIDER=browser`
- Check browser allows audio playback

### Commands not executing

**Problem**: Voice recognized but nothing happens

**Solutions**:
- Check browser console for errors
- Verify you're logged into dashboard
- Try more specific commands
- Check `.env` configuration

### Poor audio quality on mobile

**Solutions**:
- Ensure `ENABLE_MOBILE_VOICE=true`
- Check mobile browser permissions
- Use Chrome or Safari (best support)
- Consider using headphones with mic

## Example Conversation

```
You: "How many systems on hire?"
Assistant: "You currently have 15 scaffold systems on hire."

You: "What's the monthly revenue?"
Assistant: "Your total monthly revenue is £8,640.00"

You: "Change P1 to off hire"
Assistant: "I'll change P1 to off hire status. Please confirm this action."

You: "Yes, confirm"
Assistant: "Successfully changed P1 to off hire."

You: "What's the ARC contact for P14?"
Assistant: "Let me check... P14 has ARC contact number 07904685409"
```

## Privacy & Security

- All voice processing uses encrypted HTTPS connections
- Audio is sent to OpenAI servers for transcription (not stored permanently)
- API keys are stored locally in `.env` (never committed to git)
- Voice commands that modify data require confirmation
- No conversation history is stored on external servers

## Browser Compatibility

### Fully Supported
- ✅ Chrome/Edge (desktop & mobile)
- ✅ Safari (desktop & mobile iOS)
- ✅ Firefox (desktop)

### Limited Support
- ⚠️ Firefox Mobile (may need browser TTS instead of ElevenLabs)
- ⚠️ Older browsers (may not support MediaRecorder API)

## Cost Estimates

Based on typical usage:

### OpenAI Whisper (Speech-to-Text)
- **$0.006 per minute** of audio
- Average command: ~5 seconds = **$0.0005**

### OpenAI GPT-4 (Understanding)
- **~$0.01-0.03 per command**
- Depends on complexity

### ElevenLabs (Text-to-Speech)
- **Free tier**: 10,000 characters/month
- Average response: ~50 characters
- **200 commands free per month**
- Paid: **$5/month** for 30,000 characters

### Total Cost Example
100 commands per month ≈ **$1-2**

## Advanced Features

### Conversation Context

When `ENABLE_CONVERSATION_CONTEXT=true`, the assistant remembers:

```
You: "How many systems on hire?"
Assistant: "15 systems on hire"

You: "What's the revenue from those?"
          ↑ Remembers "those" = the 15 systems
Assistant: "£8,640 monthly revenue from those 15 systems"
```

### Debug Mode

Enable `VOICE_DEBUG_MODE=true` to see detailed logs:
- Transcript text
- Parsed commands
- API responses
- Execution results

## Support

For issues or questions:
1. Check browser console for errors
2. Verify `.env` configuration
3. Test with simple commands first
4. Check API key validity on provider websites

---

**Enjoy hands-free control of your dashboard!** 🎉
