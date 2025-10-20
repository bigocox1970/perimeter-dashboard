// Voice Command Log UI
// Display and manage voice command logs

class VoiceLogUI {
    constructor() {
        this.isOpen = false;
        this.panel = null;
        this.refreshInterval = null;
    }

    // Initialize the log UI
    initialize() {
        this.createPanel();
        console.log('✅ Voice Log UI initialized');
    }

    // Create the log panel
    createPanel() {
        const container = document.getElementById('voiceLogContainer');
        if (!container) {
            console.error('Voice log container not found');
            return;
        }

        this.panel = document.createElement('div');
        this.panel.id = 'voiceLogPanel';
        this.panel.className = 'voice-log-panel-tab'; // Changed class for tab view
        this.panel.innerHTML = `
            <div class="voice-log-header">
                <h3>🎤 Voice Command Log</h3>
                <div class="voice-log-actions">
                    <button class="voice-log-btn" onclick="voiceLogUI.exportLogs()" title="Export logs" style="padding: 10px 20px; font-size: 16px;">
                        📥 Export
                    </button>
                    <button class="voice-log-btn" onclick="voiceLogUI.clearLogs()" title="Clear all logs" style="padding: 10px 20px; font-size: 16px; background: #e74c3c; color: white;">
                        🗑️ Clear Logs
                    </button>
                </div>
            </div>

            <div class="voice-log-stats">
                <div class="voice-log-stat">
                    <div class="stat-value" id="logTotalCommands">0</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="voice-log-stat success">
                    <div class="stat-value" id="logSuccessCommands">0</div>
                    <div class="stat-label">Success</div>
                </div>
                <div class="voice-log-stat unhandled">
                    <div class="stat-value" id="logUnhandledCommands">0</div>
                    <div class="stat-label">Unhandled</div>
                </div>
                <div class="voice-log-stat error">
                    <div class="stat-value" id="logErrorCommands">0</div>
                    <div class="stat-label">Errors</div>
                </div>
                <div class="voice-log-stat rate">
                    <div class="stat-value" id="logSuccessRate">0%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
            </div>

            <div class="voice-log-tabs">
                <button class="voice-log-tab active" onclick="voiceLogUI.showTab('all', this)">All Commands</button>
                <button class="voice-log-tab" onclick="voiceLogUI.showTab('unhandled', this)">Unhandled</button>
                <button class="voice-log-tab" onclick="voiceLogUI.showTab('features', this)">Feature Requests</button>
            </div>

            <div class="voice-log-content">
                <div id="voiceLogTabAll" class="voice-log-tab-content active">
                    <!-- All commands list -->
                </div>
                <div id="voiceLogTabUnhandled" class="voice-log-tab-content">
                    <!-- Unhandled commands list -->
                </div>
                <div id="voiceLogTabFeatures" class="voice-log-tab-content">
                    <!-- Feature requests grouped -->
                </div>
            </div>
        `;

        container.appendChild(this.panel);

        // Auto-refresh the content periodically
        this.refresh();
        setInterval(() => this.refresh(), 5000);
    }

    // Show specific tab
    showTab(tabName, buttonElement) {
        // Update tab buttons
        const tabs = this.panel.querySelectorAll('.voice-log-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        if (buttonElement) {
            buttonElement.classList.add('active');
        }

        // Update tab content
        const contents = this.panel.querySelectorAll('.voice-log-tab-content');
        contents.forEach(content => content.classList.remove('active'));

        const targetContent = this.panel.querySelector(`#voiceLogTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        this.refresh();
    }

    // Refresh content
    refresh() {
        if (!this.panel) return;
        this.updateStats();
        this.updateAllCommandsTab();
        this.updateUnhandledTab();
        this.updateFeaturesTab();
    }

    // Update statistics
    updateStats() {
        const stats = voiceLogger.getStats();
        document.getElementById('logTotalCommands').textContent = stats.total;
        document.getElementById('logSuccessCommands').textContent = stats.success;
        document.getElementById('logUnhandledCommands').textContent = stats.unhandled;
        document.getElementById('logErrorCommands').textContent = stats.errors;
        document.getElementById('logSuccessRate').textContent = stats.successRate + '%';
    }

    // Update all commands tab
    updateAllCommandsTab() {
        const container = document.getElementById('voiceLogTabAll');
        const logs = voiceLogger.getAllLogs();

        if (logs.length === 0) {
            container.innerHTML = '<div class="voice-log-empty">No commands logged yet. Start using voice control!</div>';
            return;
        }

        container.innerHTML = logs.map(log => this.renderLogEntry(log)).join('');
    }

    // Update unhandled tab
    updateUnhandledTab() {
        const container = document.getElementById('voiceLogTabUnhandled');
        const logs = voiceLogger.getUnhandledCommands();

        if (logs.length === 0) {
            container.innerHTML = '<div class="voice-log-empty">✅ No unhandled commands! All voice commands are working.</div>';
            return;
        }

        container.innerHTML = logs.map(log => this.renderLogEntry(log)).join('');
    }

    // Update features tab
    updateFeaturesTab() {
        const container = document.getElementById('voiceLogTabFeatures');
        const features = voiceLogger.getUniqueUnhandledActions();

        if (features.length === 0) {
            container.innerHTML = '<div class="voice-log-empty">✅ No feature requests logged yet.</div>';
            return;
        }

        container.innerHTML = features.map(feature => `
            <div class="voice-feature-request">
                <div class="feature-header">
                    <div class="feature-action">${feature.action}</div>
                    <div class="feature-count">${feature.count} request${feature.count > 1 ? 's' : ''}</div>
                </div>
                <div class="feature-examples">
                    <strong>Example commands:</strong>
                    <ul>
                        ${feature.examples.map(ex => `<li>"${ex.transcript}" <span class="feature-time">${this.formatTime(ex.timestamp)}</span></li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    // Render STT provider entry
    renderSTTProviderEntry(log) {
        const isAccurate = log.accurate !== false;
        const color = isAccurate ? '#27ae60' : '#e74c3c';
        const icon = isAccurate ? '✅' : '⚠️';

        return `
            <div class="voice-log-entry stt-provider" style="border-left: 4px solid ${color}; background: ${isAccurate ? '#f0f9f4' : '#fff5f5'}">
                <div class="log-entry-header">
                    <span class="log-entry-icon">${icon}</span>
                    <span class="log-entry-transcript"><strong style="color: ${color}">${log.provider}</strong> - "${log.transcript}"</span>
                    <span class="log-entry-time">${this.formatTime(log.timestamp)}</span>
                </div>
                <div class="log-entry-details">
                    <div style="color: ${color}">
                        ${isAccurate
                            ? '<strong>✓ Using OpenAI Whisper (ACCURATE)</strong>'
                            : '<strong>⚠️ Using Browser Speech Recognition (INACCURATE - may mishear commands)</strong>'
                        }
                    </div>
                    ${log.confidence !== undefined ? `<div>Confidence: ${(log.confidence * 100).toFixed(0)}%</div>` : ''}
                </div>
            </div>
        `;
    }

    // Render TTS debug entry
    renderTTSDebugEntry(log) {
        const statusColors = {
            attempting: '#3498db',
            api_success: '#2ecc71',
            success: '#27ae60',
            blocked: '#e74c3c',
            failed: '#c0392b'
        };

        const statusIcons = {
            attempting: '🔄',
            api_success: '✓',
            success: '✅',
            blocked: '🚫',
            failed: '❌'
        };

        const statusColor = statusColors[log.status] || '#95a5a6';
        const statusIcon = statusIcons[log.status] || '🔊';
        const providerName = log.provider === 'elevenlabs' ? 'ElevenLabs' : 'Browser TTS';

        return `
            <div class="voice-log-entry tts-debug" style="border-left: 4px solid ${statusColor}">
                <div class="log-entry-header">
                    <span class="log-entry-icon">${statusIcon}</span>
                    <span class="log-entry-transcript"><strong>${providerName}</strong> - ${log.status}</span>
                    <span class="log-entry-time">${this.formatTime(log.timestamp)}</span>
                </div>
                <div class="log-entry-details">
                    ${log.method ? `<div><strong>Method:</strong> ${log.method}</div>` : ''}
                    ${log.usedPreUnlocked !== undefined ? `<div style="color: ${log.usedPreUnlocked ? '#27ae60' : '#e74c3c'}"><strong>Pre-unlocked audio:</strong> ${log.usedPreUnlocked ? 'YES ✓' : 'NO (may fail autoplay)'}</div>` : ''}
                    ${log.text ? `<div><strong>Text:</strong> "${log.text}"</div>` : ''}
                    ${log.blobSize ? `<div><strong>Audio size:</strong> ${(log.blobSize / 1024).toFixed(1)} KB (${log.blobType || 'unknown'})</div>` : ''}
                    ${log.reason ? `<div><strong>Reason:</strong> ${log.reason}</div>` : ''}
                    ${log.message ? `<div><strong>Message:</strong> ${log.message}</div>` : ''}
                    ${log.errorCode ? `<div style="color: #e74c3c"><strong>Error Code:</strong> ${log.errorCode}</div>` : ''}
                    ${log.errorDetails ? `<div style="color: #e74c3c"><strong>Details:</strong> ${log.errorDetails}</div>` : ''}
                    ${log.error ? `<div style="color: #e74c3c"><strong>Error:</strong> ${log.error}</div>` : ''}
                    ${log.blobUrl ? `<div style="font-size: 11px; color: #7f8c8d"><strong>URL:</strong> ${log.blobUrl.substring(0, 50)}...</div>` : ''}
                    ${log.willFallback ? `<div style="color: #f39c12"><strong>⚠️ Falling back to Browser TTS</strong></div>` : ''}
                    ${log.voice ? `<div><strong>Voice:</strong> ${log.voice}</div>` : ''}
                    ${log.status === 'api_success' ? `<div style="color: #27ae60">✓ Audio received from API</div>` : ''}
                    ${log.status === 'success' ? `<div style="color: #27ae60">✓ Playback completed successfully</div>` : ''}
                    ${log.status === 'blocked' ? `<div style="color: #e74c3c">⚠️ Audio playback blocked - likely autoplay policy</div>` : ''}
                </div>
            </div>
        `;
    }

    // Render a single log entry
    renderLogEntry(log) {
        const typeIcon = {
            success: '✅',
            unhandled: '⚠️',
            error: '❌',
            tts_debug: '🔊',
            stt_used: '🎤'
        };

        // Special rendering for STT provider logs
        if (log.type === 'stt_used') {
            return this.renderSTTProviderEntry(log);
        }

        // Special rendering for TTS debug logs
        if (log.type === 'tts_debug') {
            return this.renderTTSDebugEntry(log);
        }

        const isConversation = log.steps && log.steps.length > 0;
        const displayTranscript = log.originalTranscript || log.transcript;
        const displayAction = log.originalAction || log.action;

        let conversationSteps = '';
        if (isConversation) {
            conversationSteps = `
                <div class="log-conversation-steps">
                    <div class="conversation-header">📝 Conversation Flow:</div>
                    ${log.steps.map((step, idx) => `
                        <div class="conversation-step">
                            <span class="step-number">${idx + 1}.</span>
                            ${step.transcript ? `<span class="step-text">"${step.transcript}"</span>` : ''}
                            ${step.action ? `<span class="step-badge">→ ${step.action}</span>` : ''}
                            ${step.result ? `<span class="step-result">${step.result}</span>` : ''}
                            ${step.error ? `<span class="step-error">${step.error}</span>` : ''}
                        </div>
                    `).join('')}
                    ${log.finalResult ? `
                        <div class="conversation-final">
                            <strong>Final Result:</strong> ${log.finalResult.message || log.finalResult.error || (log.finalResult.success ? 'Success' : 'Failed')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Create unique ID for this log entry
        const logId = `log_${(log.startTime || log.timestamp || Date.now()).replace(/[^0-9]/g, '')}`;

        return `
            <div class="voice-log-entry ${log.type} ${isConversation ? 'conversation' : ''}" data-log-id="${logId}">
                <div class="log-entry-header">
                    <span class="log-entry-icon">${typeIcon[log.type] || '📝'}</span>
                    <span class="log-entry-transcript">"${displayTranscript}"</span>
                    <span class="log-entry-time">${this.formatTime(log.startTime || log.timestamp)}</span>
                    <button class="log-copy-btn" onclick="voiceLogUI.copyLogEntry('${logId}')" title="Copy to clipboard">
                        📋
                    </button>
                </div>
                <div class="log-entry-details">
                    ${displayAction ? `<span class="log-detail-badge">Action: ${displayAction}</span>` : ''}
                    ${log.originalIntent || log.intent ? `<span class="log-detail-badge">Intent: ${log.originalIntent || log.intent}</span>` : ''}
                    ${!isConversation && log.result ? `<span class="log-detail-result">${log.result}</span>` : ''}
                    ${!isConversation && log.error ? `<span class="log-detail-error">${log.error}</span>` : ''}
                    ${log.reason ? `<span class="log-detail-reason">${log.reason}</span>` : ''}
                </div>
                ${conversationSteps}
                <pre class="log-raw-data" style="display:none">${JSON.stringify(log, null, 2)}</pre>
            </div>
        `;
    }

    // Copy log entry to clipboard
    copyLogEntry(logId) {
        const entry = document.querySelector(`[data-log-id="${logId}"]`);
        if (!entry) {
            console.error('Log entry not found');
            return;
        }

        const rawData = entry.querySelector('.log-raw-data');
        if (!rawData) {
            console.error('Raw data not found');
            return;
        }

        // Copy to clipboard
        const text = rawData.textContent;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopyFeedback(entry);
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.fallbackCopy(text, entry);
            });
        } else {
            this.fallbackCopy(text, entry);
        }
    }

    // Fallback copy method for older browsers
    fallbackCopy(text, entry) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            this.showCopyFeedback(entry);
        } catch (err) {
            console.error('Fallback copy failed:', err);
            alert('Failed to copy. Please copy manually from browser console.');
        }

        document.body.removeChild(textarea);
    }

    // Show visual feedback that copy succeeded
    showCopyFeedback(entry) {
        const btn = entry.querySelector('.log-copy-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✓';
            btn.style.background = '#43e97b';
            btn.style.color = 'white';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
            }, 2000);
        }
    }

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Export logs
    exportLogs() {
        voiceLogger.exportLogs();
    }

    // Clear logs
    clearLogs() {
        if (confirm('Are you sure you want to clear all voice command logs?')) {
            voiceLogger.clearLogs();
            this.refresh();
        }
    }
}

// Create global instance
const voiceLogUI = new VoiceLogUI();
