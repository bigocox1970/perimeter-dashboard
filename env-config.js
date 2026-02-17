// Environment Configuration Loader
// This file loads configuration from voice-config.js

class EnvConfig {
    constructor() {
        this.config = {};
        this.loaded = false;
    }

    async load() {
        try {
            // Check if VOICE_CONFIG is available
            if (typeof VOICE_CONFIG === 'undefined') {
                console.error('❌ VOICE_CONFIG not found. Make sure voice-config.js is loaded before this file.');
                this.setDefaults();
                return false;
            }

            // Load config from VOICE_CONFIG
            this.config = { ...VOICE_CONFIG };
            this.loaded = true;
            console.log('✅ Voice configuration loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load voice configuration:', error);
            console.warn('⚠️ Using default configuration');
            this.setDefaults();
            return false;
        }
    }

    setDefaults() {
        this.config = {
            VOICE_CONTROL_ENABLED: true,
            VOICE_LANGUAGE: 'en-GB',
            VOICE_ASSISTANT_NAME: 'Perimeter Assistant',
            VOICE_CONFIDENCE_THRESHOLD: 0.7,
            VOICE_REQUIRE_CONFIRMATION: true,
            VOICE_MAX_RECORDING_DURATION: 30,
            TTS_PROVIDER: 'browser',
            BROWSER_TTS_VOICE: 'Google UK English Female',
            TTS_SPEECH_RATE: 1.0,
            TTS_SPEECH_PITCH: 1.0,
            TTS_SPEECH_VOLUME: 1.0,
            NLP_PROVIDER: 'openai',
            ENABLE_CONVERSATION_CONTEXT: true,
            MAX_CONVERSATION_HISTORY: 10,
            ENABLE_WAKE_WORD: false,
            ENABLE_CONTINUOUS_LISTENING: false,
            ENABLE_MOBILE_VOICE: true,
            ENABLE_VOICE_FEEDBACK: true,
            VOICE_DEBUG_MODE: false,
            OPENAI_MODEL: 'gpt-4-turbo-preview',
            OPENAI_WHISPER_MODEL: 'whisper-1',
            ELEVENLABS_VOICE_ID: '21m00Tcm4TlvDq8ikWAM'
        };
    }

    get(key, defaultValue = null) {
        const value = this.config[key];
        if (value === undefined || value === null) return defaultValue;
        return value;
    }

    getBool(key, defaultValue = false) {
        const value = this.get(key);
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'boolean') return value;
        return value === 'true' || value === '1' || value === 1;
    }

    getNumber(key, defaultValue = 0) {
        const value = this.get(key);
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'number') return value;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    has(key) {
        return key in this.config && this.config[key] !== null && this.config[key] !== undefined;
    }

    isLoaded() {
        return this.loaded;
    }

    // Validate required API keys
    validate() {
        const issues = [];

        if (!this.get('OPENAI_API_KEY') || this.get('OPENAI_API_KEY').includes('your_')) {
            issues.push('OPENAI_API_KEY is missing or not configured');
        }

        const ttsProvider = this.get('TTS_PROVIDER');
        if (ttsProvider === 'elevenlabs') {
            if (!this.get('ELEVENLABS_API_KEY') || this.get('ELEVENLABS_API_KEY').includes('your_')) {
                console.warn('⚠️ ELEVENLABS_API_KEY not configured, falling back to browser TTS');
                this.config.TTS_PROVIDER = 'browser';
            }
        }

        if (issues.length > 0) {
            console.error('❌ Configuration validation failed:', issues);
            return false;
        }

        console.log('✅ Configuration validated successfully');
        return true;
    }

    // Get all config for debugging
    getAll() {
        // Redact sensitive keys
        const safe = { ...this.config };
        if (safe.OPENAI_API_KEY) {
            safe.OPENAI_API_KEY = safe.OPENAI_API_KEY.substring(0, 10) + '...' + safe.OPENAI_API_KEY.slice(-4);
        }
        if (safe.ELEVENLABS_API_KEY) {
            safe.ELEVENLABS_API_KEY = safe.ELEVENLABS_API_KEY.substring(0, 10) + '...' + safe.ELEVENLABS_API_KEY.slice(-4);
        }
        if (safe.DEEPGRAM_API_KEY) {
            safe.DEEPGRAM_API_KEY = '***REDACTED***';
        }
        return safe;
    }
}

// Create global instance
const envConfig = new EnvConfig();
