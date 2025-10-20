#!/usr/bin/env node
// Build script to generate voice-config.js from environment variables
// This runs during Netlify build to inject env vars into the frontend

const fs = require('fs');
const path = require('path');

console.log('🔧 Generating voice-config.js from environment variables...');

// Read environment variables (available during Netlify build)
const config = {
    // API Keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',

    // Use browser speech recognition by default
    USE_BROWSER_STT: process.env.USE_BROWSER_STT !== 'false', // default true

    // OpenAI Settings
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    OPENAI_WHISPER_MODEL: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',

    // ElevenLabs Settings
    ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',

    // Voice Control Settings
    VOICE_CONTROL_ENABLED: process.env.VOICE_CONTROL_ENABLED !== 'false', // default true
    VOICE_LANGUAGE: process.env.VOICE_LANGUAGE || 'en-GB',
    VOICE_ASSISTANT_NAME: process.env.VOICE_ASSISTANT_NAME || 'Perimeter Assistant',
    VOICE_CONFIDENCE_THRESHOLD: parseFloat(process.env.VOICE_CONFIDENCE_THRESHOLD) || 0.7,
    VOICE_REQUIRE_CONFIRMATION: process.env.VOICE_REQUIRE_CONFIRMATION !== 'false',
    VOICE_MAX_RECORDING_DURATION: parseInt(process.env.VOICE_MAX_RECORDING_DURATION) || 30,

    // TTS Settings
    TTS_PROVIDER: process.env.TTS_PROVIDER || 'elevenlabs',
    BROWSER_TTS_VOICE: process.env.BROWSER_TTS_VOICE || 'Google UK English Female',
    TTS_SPEECH_RATE: parseFloat(process.env.TTS_SPEECH_RATE) || 1.0,
    TTS_SPEECH_PITCH: parseFloat(process.env.TTS_SPEECH_PITCH) || 1.0,
    TTS_SPEECH_VOLUME: parseFloat(process.env.TTS_SPEECH_VOLUME) || 1.0,

    // NLP Settings
    NLP_PROVIDER: process.env.NLP_PROVIDER || 'openai',
    ENABLE_CONVERSATION_CONTEXT: process.env.ENABLE_CONVERSATION_CONTEXT !== 'false',
    MAX_CONVERSATION_HISTORY: parseInt(process.env.MAX_CONVERSATION_HISTORY) || 10,

    // Feature Flags
    ENABLE_WAKE_WORD: process.env.ENABLE_WAKE_WORD === 'true',
    ENABLE_CONTINUOUS_LISTENING: process.env.ENABLE_CONTINUOUS_LISTENING === 'true',
    ENABLE_MOBILE_VOICE: process.env.ENABLE_MOBILE_VOICE !== 'false',
    ENABLE_VOICE_FEEDBACK: process.env.ENABLE_VOICE_FEEDBACK !== 'false',
    VOICE_DEBUG_MODE: process.env.VOICE_DEBUG_MODE === 'true'
};

// Generate the JavaScript file content
const fileContent = `// Voice Control Configuration
// AUTO-GENERATED during build from environment variables
// DO NOT EDIT - Changes will be overwritten on next build

const VOICE_CONFIG = ${JSON.stringify(config, null, 4)};

// Export for use in env-config.js
if (typeof window !== 'undefined') {
    window.VOICE_CONFIG = VOICE_CONFIG;
}
`;

// Write to voice-config.js
const outputPath = path.join(__dirname, 'voice-config.js');
fs.writeFileSync(outputPath, fileContent);

// Redact sensitive info for logging
const safeConfig = { ...config };
if (safeConfig.OPENAI_API_KEY) {
    safeConfig.OPENAI_API_KEY = safeConfig.OPENAI_API_KEY.substring(0, 10) + '...(redacted)';
}
if (safeConfig.ELEVENLABS_API_KEY) {
    safeConfig.ELEVENLABS_API_KEY = safeConfig.ELEVENLABS_API_KEY.substring(0, 10) + '...(redacted)';
}

console.log('✅ voice-config.js generated successfully');
console.log('📋 Configuration:', JSON.stringify(safeConfig, null, 2));

// Validate required keys
const warnings = [];
if (!config.OPENAI_API_KEY || config.OPENAI_API_KEY === '') {
    warnings.push('⚠️  WARNING: OPENAI_API_KEY is not set');
}
if (config.TTS_PROVIDER === 'elevenlabs' && (!config.ELEVENLABS_API_KEY || config.ELEVENLABS_API_KEY === '')) {
    warnings.push('⚠️  WARNING: ELEVENLABS_API_KEY is not set (will fallback to browser TTS)');
}

if (warnings.length > 0) {
    console.warn('\n' + warnings.join('\n'));
}
