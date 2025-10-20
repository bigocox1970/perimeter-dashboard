// Voice Command Logger
// Tracks all voice commands and logs unhandled ones for improvement

class VoiceCommandLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.currentConversation = null; // Track ongoing conversation
        this.conversationId = 0;
        this.loadLogs();
    }

    // Start a new conversation chain
    startConversation(transcript, intent, action) {
        this.conversationId++;
        this.currentConversation = {
            id: this.conversationId,
            startTime: new Date().toISOString(),
            originalTranscript: transcript,
            originalIntent: intent,
            originalAction: action,
            steps: []
        };
    }

    // Add a step to current conversation
    addConversationStep(step) {
        if (this.currentConversation) {
            this.currentConversation.steps.push({
                timestamp: new Date().toISOString(),
                ...step
            });
        }
    }

    // End conversation and log it
    endConversation(finalResult) {
        if (this.currentConversation) {
            this.currentConversation.endTime = new Date().toISOString();
            this.currentConversation.finalResult = finalResult;

            // Determine if conversation was successful
            const type = finalResult.success ? 'success' :
                        finalResult.unhandled ? 'unhandled' : 'error';

            this.log(type, this.currentConversation);
            this.currentConversation = null;
        }
    }

    // Log a voice command
    log(type, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            type: type, // 'success', 'unhandled', 'error'
            ...data
        };

        this.logs.unshift(entry); // Add to beginning

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        this.saveLogs();

        // Show notification for unhandled commands
        if (type === 'unhandled') {
            console.warn('⚠️ Unhandled command logged:', data.originalTranscript || data.transcript);
        }
    }

    // Log successful command (simple version for backwards compatibility)
    logSuccess(transcript, action, result) {
        // If part of conversation, add as step
        if (this.currentConversation) {
            this.addConversationStep({
                type: 'success',
                transcript,
                action,
                result: result?.message
            });
            this.endConversation({ success: true, message: result?.message });
        } else {
            // Standalone success
            this.log('success', {
                transcript,
                action,
                result: result?.message || 'Success'
            });
        }
    }

    // Log unhandled command (simple version for backwards compatibility)
    logUnhandled(transcript, action, intent, parameters) {
        // If part of conversation, add as step
        if (this.currentConversation) {
            this.addConversationStep({
                type: 'unhandled',
                transcript,
                action,
                intent,
                parameters
            });
            this.endConversation({ success: false, unhandled: true, action });
        } else {
            // Standalone unhandled
            this.log('unhandled', {
                transcript,
                action,
                intent,
                parameters,
                reason: 'Command not implemented'
            });
        }
    }

    // Log error (simple version for backwards compatibility)
    logError(transcript, error) {
        // If part of conversation, add as step
        if (this.currentConversation) {
            this.addConversationStep({
                type: 'error',
                transcript,
                error: error.message || error
            });
            this.endConversation({ success: false, error: error.message || error });
        } else {
            // Standalone error
            this.log('error', {
                transcript,
                error: error.message || error
            });
        }
    }

    // Log TTS (Text-to-Speech) events for debugging
    logTTS(provider, status, details = {}) {
        const entry = {
            type: 'tts_debug',
            provider, // 'elevenlabs' or 'browser'
            status, // 'attempting', 'success', 'failed', 'blocked'
            ...details
        };

        // Add to current conversation if active
        if (this.currentConversation) {
            this.addConversationStep(entry);
        }

        // Also log standalone for visibility
        this.log('tts_debug', entry);

        console.log(`🔊 TTS Log [${provider}] ${status}:`, details);
    }

    // Get all logs
    getAllLogs() {
        return this.logs;
    }

    // Get unhandled commands only
    getUnhandledCommands() {
        return this.logs.filter(log => log.type === 'unhandled');
    }

    // Get statistics
    getStats() {
        // Filter out tts_debug from stats (they're just debugging info)
        const commandLogs = this.logs.filter(l => l.type !== 'tts_debug');
        const total = commandLogs.length;
        const success = commandLogs.filter(l => l.type === 'success').length;
        const unhandled = commandLogs.filter(l => l.type === 'unhandled').length;
        const errors = commandLogs.filter(l => l.type === 'error').length;

        return {
            total,
            success,
            unhandled,
            errors,
            successRate: total > 0 ? ((success / total) * 100).toFixed(1) : 0
        };
    }

    // Get unique unhandled actions (for feature planning)
    getUniqueUnhandledActions() {
        const unhandled = this.getUnhandledCommands();
        const actionMap = {};

        unhandled.forEach(log => {
            const action = log.originalAction || log.action || 'unknown';
            if (!actionMap[action]) {
                actionMap[action] = {
                    action,
                    count: 0,
                    examples: []
                };
            }
            actionMap[action].count++;
            if (actionMap[action].examples.length < 3) {
                actionMap[action].examples.push({
                    transcript: log.originalTranscript || log.transcript,
                    timestamp: log.startTime || log.timestamp,
                    steps: log.steps
                });
            }
        });

        return Object.values(actionMap).sort((a, b) => b.count - a.count);
    }

    // Save to localStorage
    saveLogs() {
        try {
            localStorage.setItem('voiceCommandLogs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to save logs:', error);
        }
    }

    // Load from localStorage
    loadLogs() {
        try {
            const saved = localStorage.getItem('voiceCommandLogs');
            if (saved) {
                this.logs = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
            this.logs = [];
        }
    }

    // Clear all logs
    clearLogs() {
        this.logs = [];
        this.saveLogs();
    }

    // Export logs as JSON
    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `voice-command-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Create global instance
const voiceLogger = new VoiceCommandLogger();
