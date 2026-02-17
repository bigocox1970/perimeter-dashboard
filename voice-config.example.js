// Voice Control Configuration Template
// Copy this file to voice-config.js and add your API keys

const VOICE_CONFIG = {
    // ============================================
    // API KEYS (Required)
    // ============================================
    OPENAI_API_KEY: 'your_openai_api_key_here',
    ELEVENLABS_API_KEY: 'your_elevenlabs_api_key_here',

    // ============================================
    // OpenAI Settings
    // ============================================
    OPENAI_MODEL: 'gpt-4-turbo-preview',
    OPENAI_WHISPER_MODEL: 'whisper-1',

    // ============================================
    // ElevenLabs Settings
    // ============================================
    ELEVENLABS_VOICE_ID: '21m00Tcm4TlvDq8ikWAM', // Rachel - Calm, clear female voice
    // Other available voices:
    // 'EXAVITQu4vr4xnSDxMaL' - Bella (Professional female)
    // 'ErXwobaYiN019PkySvjV' - Antoni (Professional male)
    // 'VR6AewLTigWG4xSOukaG' - Arnold (Deep male)

    // ============================================
    // Voice Control Settings
    // ============================================
    VOICE_CONTROL_ENABLED: true,
    VOICE_LANGUAGE: 'en-GB',
    VOICE_ASSISTANT_NAME: 'Perimeter Assistant',
    VOICE_CONFIDENCE_THRESHOLD: 0.7,
    VOICE_REQUIRE_CONFIRMATION: true,
    VOICE_MAX_RECORDING_DURATION: 30, // seconds

    // ============================================
    // TTS Settings
    // ============================================
    TTS_PROVIDER: 'elevenlabs', // 'elevenlabs' or 'browser'
    BROWSER_TTS_VOICE: 'Google UK English Female',
    TTS_SPEECH_RATE: 1.0,
    TTS_SPEECH_PITCH: 1.0,
    TTS_SPEECH_VOLUME: 1.0,

    // ============================================
    // NLP Settings
    // ============================================
    NLP_PROVIDER: 'openai',
    ENABLE_CONVERSATION_CONTEXT: true,
    MAX_CONVERSATION_HISTORY: 10,

    // ============================================
    // Feature Flags
    // ============================================
    ENABLE_WAKE_WORD: false,
    ENABLE_CONTINUOUS_LISTENING: false,
    ENABLE_MOBILE_VOICE: true,
    ENABLE_VOICE_FEEDBACK: true,
    VOICE_DEBUG_MODE: true // Set to false in production
};
