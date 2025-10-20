// Voice Control UI Components
// Manages the visual interface for voice interactions

class VoiceUI {
    constructor() {
        this.container = null;
        this.micButton = null;
        this.statusIndicator = null;
        this.transcript = null;
        this.responseText = null;
        this.isInitialized = false;
    }

    // Initialize and inject UI into the page
    initialize() {
        if (this.isInitialized) return;

        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'voice-control-container';
        this.container.innerHTML = `
            <div class="voice-control-wrapper">
                <!-- Floating Microphone Button -->
                <button id="voiceMicButton" class="voice-mic-button" title="Click to speak">
                    <svg class="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <div class="listening-pulse"></div>
                </button>

                <!-- Status Indicator -->
                <div id="voiceStatusIndicator" class="voice-status-indicator">
                    <div class="status-content">
                        <div class="status-icon"></div>
                        <div class="status-text">Ready</div>
                    </div>
                </div>

                <!-- Transcript Display -->
                <div id="voiceTranscript" class="voice-transcript">
                    <div class="transcript-label">You said:</div>
                    <div class="transcript-text"></div>
                </div>

                <!-- Response Display -->
                <div id="voiceResponse" class="voice-response">
                    <div class="response-label">Assistant:</div>
                    <div class="response-text"></div>
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(this.container);

        // Get references
        this.micButton = document.getElementById('voiceMicButton');
        this.statusIndicator = document.getElementById('voiceStatusIndicator');
        this.transcript = document.getElementById('voiceTranscript');
        this.responseText = document.getElementById('voiceResponse');

        // Setup event listeners
        this.setupEventListeners();

        this.isInitialized = true;
        console.log('✅ Voice UI initialized');
    }

    setupEventListeners() {
        // Microphone button - click to toggle (more reliable than hold)
        this.micButton.addEventListener('click', (e) => {
            e.preventDefault();

            // Unlock audio context on user interaction
            if (voiceControl.unlockAudio) {
                voiceControl.unlockAudio();
            }

            if (voiceControl.isListening) {
                voiceControl.stopListening();
            } else if (!voiceControl.isProcessing) {
                voiceControl.startListening();
            }
        });

        // Connect to voice control callbacks
        voiceControl.onStatusChange((status, message) => {
            this.updateStatus(status, message);
        });

        voiceControl.onTranscript((text) => {
            this.showTranscript(text);
        });
    }

    updateStatus(status, message = '') {
        const statusText = this.statusIndicator.querySelector('.status-text');
        const statusIcon = this.statusIndicator.querySelector('.status-icon');

        // Remove all status classes
        this.micButton.className = 'voice-mic-button';
        this.statusIndicator.className = 'voice-status-indicator';

        // Add appropriate class and update text
        switch (status) {
            case 'requesting-permission':
                this.statusIndicator.classList.add('show', 'status-requesting');
                statusText.textContent = 'Requesting microphone...';
                break;

            case 'listening':
                this.micButton.classList.add('listening');
                this.statusIndicator.classList.add('show', 'status-listening');
                statusText.textContent = 'Listening...';
                this.hideTranscript();
                this.hideResponse();
                break;

            case 'processing':
            case 'transcribing':
                this.micButton.classList.add('processing');
                this.statusIndicator.classList.add('show', 'status-processing');
                statusText.textContent = 'Processing...';
                break;

            case 'thinking':
                this.micButton.classList.add('thinking');
                this.statusIndicator.classList.add('show', 'status-thinking');
                statusText.textContent = 'Understanding...';
                break;

            case 'executing':
                this.micButton.classList.add('executing');
                this.statusIndicator.classList.add('show', 'status-executing');
                statusText.textContent = 'Executing command...';
                break;

            case 'speaking':
                this.micButton.classList.add('speaking');
                this.statusIndicator.classList.add('show', 'status-speaking');
                statusText.textContent = 'Speaking...';
                this.showResponse(message);
                break;

            case 'error':
                this.micButton.classList.add('error');
                this.statusIndicator.classList.add('show', 'status-error');
                statusText.textContent = message || 'Error occurred';
                setTimeout(() => this.updateStatus('idle'), 3000);
                break;

            case 'awaiting-confirmation':
                this.statusIndicator.classList.add('show', 'status-waiting');
                statusText.textContent = 'Awaiting confirmation...';
                break;

            case 'idle':
            default:
                setTimeout(() => {
                    this.statusIndicator.classList.remove('show');
                }, 500);
                statusText.textContent = 'Ready';
                break;
        }
    }

    showTranscript(text) {
        const transcriptText = this.transcript.querySelector('.transcript-text');
        transcriptText.textContent = text;
        this.transcript.classList.add('show');

        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideTranscript();
        }, 10000);
    }

    hideTranscript() {
        this.transcript.classList.remove('show');
    }

    showResponse(text) {
        const responseText = this.responseText.querySelector('.response-text');
        responseText.textContent = text;
        this.responseText.classList.add('show');

        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideResponse();
        }, 10000);
    }

    hideResponse() {
        this.responseText.classList.remove('show');
    }

    // Show/hide the entire voice control UI
    show() {
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }

    // Toggle visibility
    toggle() {
        if (this.container.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }
}

// Create global instance
const voiceUI = new VoiceUI();
