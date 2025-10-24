// Voice Command Logger
// Tracks all voice commands and logs unhandled ones for improvement

class VoiceCommandLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.currentConversation = null; // Track ongoing conversation
        this.conversationId = 0;
        this.unsyncedLogs = []; // Queue for logs that haven't been synced to DB
        this.isOnline = navigator.onLine;

        // Load logs from localStorage immediately (synchronous)
        this.loadLogsFromLocalStorage();

        // Then try to load from Supabase in background (async)
        this.loadLogsFromSupabase();

        // Set up online/offline listeners
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🟢 Back online - syncing logs...');
            this.syncUnsavedLogs();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🔴 Offline - logs will queue for sync');
        });
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
            synced: false, // Track if synced to DB
            ...data
        };

        this.logs.unshift(entry); // Add to beginning

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Save to localStorage immediately
        this.saveLogs();

        // Save to Supabase (async)
        this.saveToSupabase(entry);

        // Show notification for unhandled commands
        if (type === 'unhandled') {
            console.warn('⚠️ Unhandled command logged:', data.originalTranscript || data.transcript);
        }
    }

    // Log successful command (simple version for backwards compatibility)
    logSuccess(transcript, action, result) {
        // If part of conversation, just end it with the result
        // Don't add a success step - that would duplicate the final result
        if (this.currentConversation) {
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
        // If part of conversation, just end it as unhandled
        // Don't add an unhandled step - that would duplicate the info
        if (this.currentConversation) {
            this.endConversation({ success: false, unhandled: true, action, reason: 'Command not implemented' });
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
        // If part of conversation, just end it with the error
        // Don't add an error step - that would duplicate the error message
        if (this.currentConversation) {
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

        // ONLY add to conversation steps if active - don't create standalone logs
        // This prevents duplicate TTS entries in the logs
        if (this.currentConversation) {
            this.addConversationStep(entry);
        }
        // Don't log standalone - causes duplicates

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
        // Filter out tts_debug and stt_used from stats (they're just debugging info)
        const commandLogs = this.logs.filter(l => l.type !== 'tts_debug' && l.type !== 'stt_used');
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

    // Save to localStorage (immediate backup)
    saveLogs() {
        try {
            localStorage.setItem('voiceCommandLogs', JSON.stringify(this.logs));
            localStorage.setItem('voiceCommandLogsUnsynced', JSON.stringify(this.unsyncedLogs));
        } catch (error) {
            console.error('Failed to save logs to localStorage:', error);
        }
    }

    // Load from localStorage immediately (synchronous)
    loadLogsFromLocalStorage() {
        try {
            // Load main logs
            const saved = localStorage.getItem('voiceCommandLogs');
            if (saved) {
                this.logs = JSON.parse(saved);
                console.log(`📦 Loaded ${this.logs.length} voice logs from localStorage`);
            }

            // Load unsynced logs
            const unsynced = localStorage.getItem('voiceCommandLogsUnsynced');
            if (unsynced) {
                this.unsyncedLogs = JSON.parse(unsynced);
                console.log(`⏳ ${this.unsyncedLogs.length} voice logs waiting to sync`);
            }
        } catch (error) {
            console.error('Failed to load voice logs from localStorage:', error);
            this.logs = [];
        }
    }

    // Load from Supabase in background (asynchronous)
    async loadLogsFromSupabase() {
        if (!window.supabase || !this.isOnline) {
            return;
        }

        try {
            console.log('📥 Loading voice logs from Supabase...');
            const { data, error } = await window.supabase
                .from('perim_voice_command_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(this.maxLogs);

            if (!error && data && data.length > 0) {
                // Convert DB format back to app format
                this.logs = data.map(log => this.convertFromDBFormat(log));
                console.log(`✅ Loaded ${data.length} voice logs from Supabase`);

                // Save to localStorage as backup
                this.saveLogs();

                // Refresh the UI if it's already displayed
                if (window.voiceLogUI) {
                    window.voiceLogUI.refresh();
                }
            } else if (error) {
                console.error('Failed to load voice logs from Supabase:', error);
            }

            // Try to sync any unsynced logs
            if (this.unsyncedLogs.length > 0) {
                this.syncUnsavedLogs();
            }
        } catch (error) {
            console.error('Error loading voice logs from Supabase:', error);
        }
    }

    // Save a single log entry to Supabase
    async saveToSupabase(entry) {
        if (!window.supabase) {
            console.warn('Supabase not initialized - log saved to localStorage only');
            this.unsyncedLogs.push(entry);
            this.saveLogs();
            return;
        }

        if (!this.isOnline) {
            console.log('📴 Offline - queuing log for sync');
            this.unsyncedLogs.push(entry);
            this.saveLogs();
            return;
        }

        try {
            const dbEntry = this.convertToDBFormat(entry);
            const { error } = await window.supabase
                .from('perim_voice_command_logs')
                .insert([dbEntry]);

            if (error) {
                console.error('Failed to save log to Supabase:', error);
                this.unsyncedLogs.push(entry);
                this.saveLogs();
            } else {
                // Mark as synced
                entry.synced = true;
                this.saveLogs();
            }
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            this.unsyncedLogs.push(entry);
            this.saveLogs();
        }
    }

    // Sync all unsynced logs to Supabase
    async syncUnsavedLogs() {
        if (!window.supabase || !this.isOnline || this.unsyncedLogs.length === 0) {
            return;
        }

        console.log(`🔄 Syncing ${this.unsyncedLogs.length} logs to Supabase...`);

        const logsToSync = [...this.unsyncedLogs];
        this.unsyncedLogs = [];

        for (const entry of logsToSync) {
            try {
                const dbEntry = this.convertToDBFormat(entry);
                const { error } = await window.supabase
                    .from('perim_voice_command_logs')
                    .insert([dbEntry]);

                if (error) {
                    console.error('Failed to sync log:', error);
                    this.unsyncedLogs.push(entry);
                } else {
                    // Mark as synced in the logs array
                    const logIndex = this.logs.findIndex(l =>
                        l.timestamp === entry.timestamp && l.type === entry.type
                    );
                    if (logIndex !== -1) {
                        this.logs[logIndex].synced = true;
                    }
                }
            } catch (error) {
                console.error('Error syncing log:', error);
                this.unsyncedLogs.push(entry);
            }
        }

        this.saveLogs();

        if (this.unsyncedLogs.length === 0) {
            console.log('✅ All logs synced successfully');
        } else {
            console.warn(`⚠️ ${this.unsyncedLogs.length} logs failed to sync`);
        }
    }

    // Convert app format to DB format
    convertToDBFormat(entry) {
        return {
            timestamp: entry.timestamp,
            type: entry.type,
            transcript: entry.transcript,
            original_transcript: entry.originalTranscript,
            action: entry.action,
            original_action: entry.originalAction,
            intent: entry.intent,
            original_intent: entry.originalIntent,
            parameters: entry.parameters,
            result: entry.result,
            error: entry.error,
            reason: entry.reason,
            conversation_id: entry.id || entry.conversationId,
            start_time: entry.startTime,
            end_time: entry.endTime,
            steps: entry.steps,
            final_result: entry.finalResult,
            provider: entry.provider,
            status: entry.status,
            accurate: entry.accurate,
            confidence: entry.confidence,
            metadata: entry.metadata || {},
            synced: true
        };
    }

    // Convert DB format back to app format
    convertFromDBFormat(dbEntry) {
        return {
            timestamp: dbEntry.timestamp,
            type: dbEntry.type,
            transcript: dbEntry.transcript,
            originalTranscript: dbEntry.original_transcript,
            action: dbEntry.action,
            originalAction: dbEntry.original_action,
            intent: dbEntry.intent,
            originalIntent: dbEntry.original_intent,
            parameters: dbEntry.parameters,
            result: dbEntry.result,
            error: dbEntry.error,
            reason: dbEntry.reason,
            id: dbEntry.conversation_id,
            conversationId: dbEntry.conversation_id,
            startTime: dbEntry.start_time,
            endTime: dbEntry.end_time,
            steps: dbEntry.steps,
            finalResult: dbEntry.final_result,
            provider: dbEntry.provider,
            status: dbEntry.status,
            accurate: dbEntry.accurate,
            confidence: dbEntry.confidence,
            metadata: dbEntry.metadata,
            synced: true
        };
    }

    // Clear all logs (both localStorage and Supabase)
    async clearLogs() {
        this.logs = [];
        this.unsyncedLogs = [];
        this.saveLogs();

        // Also clear from Supabase if online
        if (window.supabase && this.isOnline) {
            try {
                const { error } = await window.supabase
                    .from('perim_voice_command_logs')
                    .delete()
                    .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all

                if (error) {
                    console.error('Failed to clear logs from Supabase:', error);
                } else {
                    console.log('✅ Cleared all logs from Supabase');
                }
            } catch (error) {
                console.error('Error clearing Supabase logs:', error);
            }
        }
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
