// Voice Control System for Perimeter Dashboard
// Handles speech recognition, natural language processing, and voice responses

class VoiceControl {
    constructor() {
        this.isListening = false;
        this.isProcessing = false;
        this.isSpeaking = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.conversationHistory = [];
        this.lastContext = null;
        this.statusCallback = null;
        this.transcriptCallback = null;
        this.audioUnlocked = false;
    }

    // Unlock audio playback (must be called on user interaction)
    unlockAudio() {
        if (this.audioUnlocked) return;

        try {
            // Play a silent audio to unlock the audio context
            const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
            silentAudio.volume = 0;
            const playPromise = silentAudio.play();
            if (playPromise) {
                playPromise.then(() => {
                    this.audioUnlocked = true;
                    console.log('🔊 Audio unlocked successfully');
                }).catch(() => {
                    console.log('⚠️ Audio unlock failed - will retry on next interaction');
                });
            }
        } catch (error) {
            console.log('⚠️ Audio unlock error:', error);
        }
    }

    async initialize() {
        try {
            console.log('🎤 Initializing Voice Control System...');

            // Load environment config
            await envConfig.load();

            if (!envConfig.validate()) {
                throw new Error('Configuration validation failed');
            }

            // Check browser support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser does not support audio recording');
            }

            console.log('✅ Voice Control System initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Voice Control:', error);
            return false;
        }
    }

    // Set callback for status updates (listening, processing, speaking, idle)
    onStatusChange(callback) {
        this.statusCallback = callback;
    }

    // Set callback for transcript updates
    onTranscript(callback) {
        this.transcriptCallback = callback;
    }

    updateStatus(status, message = '') {
        if (this.statusCallback) {
            this.statusCallback(status, message);
        }
        if (envConfig.getBool('VOICE_DEBUG_MODE')) {
            console.log(`🎙️ Status: ${status}${message ? ' - ' + message : ''}`);
        }
    }

    // Start listening for voice input
    async startListening() {
        if (this.isListening) {
            console.warn('Already listening');
            return;
        }

        // Check if we should use browser Web Speech API as fallback
        const useBrowserSTT = envConfig.getBool('USE_BROWSER_STT', false);

        if (useBrowserSTT) {
            this.startBrowserSpeechRecognition();
            return;
        }

        try {
            this.updateStatus('requesting-permission', 'Requesting microphone access...');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Process the audio
                await this.processAudio(audioBlob);
            };

            this.mediaRecorder.start();
            this.isListening = true;
            this.updateStatus('listening', 'Listening...');

            // Auto-stop after max duration
            const maxDuration = envConfig.getNumber('VOICE_MAX_RECORDING_DURATION', 30);
            setTimeout(() => {
                if (this.isListening) {
                    this.stopListening();
                }
            }, maxDuration * 1000);

        } catch (error) {
            console.error('❌ Failed to start listening:', error);
            this.updateStatus('error', 'Failed to access microphone');
            this.isListening = false;
        }
    }

    // Browser-based speech recognition (free, no API needed)
    startBrowserSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.updateStatus('error', 'Browser speech recognition not supported');
            this.speak('Sorry, your browser does not support speech recognition.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        // Create new instance each time to avoid state issues
        if (this.recognition) {
            try {
                this.recognition.abort();
            } catch (e) {
                // Ignore errors when aborting
            }
        }

        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = envConfig.get('VOICE_LANGUAGE', 'en-GB');

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('listening', 'Listening... Speak now');
            console.log('🎤 Browser speech recognition started');
            console.log('🎯 Speak clearly and wait for processing');
        };

        this.recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;

            console.log('📝 Transcript:', transcript);
            console.log('🎯 Confidence:', confidence);

            if (this.transcriptCallback) {
                this.transcriptCallback(transcript);
            }

            this.updateStatus('processing', 'Processing command...');
            await this.processCommand(transcript);
        };

        this.recognition.onerror = async (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.isListening = false;

            let message = 'Sorry, I had trouble hearing you.';
            let shouldSpeak = true;

            if (event.error === 'no-speech') {
                message = 'No speech detected. Please speak louder or hold the button longer.';
            } else if (event.error === 'not-allowed') {
                message = 'Microphone access denied. Please allow microphone access in your browser settings.';
            } else if (event.error === 'aborted') {
                // Don't speak for aborted - user likely interrupted
                shouldSpeak = false;
                message = 'Cancelled';
            } else if (event.error === 'network') {
                message = 'Network error. Please check your internet connection.';
            }

            this.updateStatus('error', message);
            if (shouldSpeak) {
                await this.speak(message);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.updateStatus) {
                this.updateStatus('idle');
            }
        };

        try {
            this.recognition.start();
        } catch (error) {
            console.error('❌ Failed to start recognition:', error);
            this.updateStatus('error', 'Failed to start speech recognition');
        }
    }

    // Stop listening
    stopListening() {
        // If using browser STT
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Already stopped
            }
            return;
        }

        // If using MediaRecorder
        if (!this.isListening || !this.mediaRecorder) {
            return;
        }

        this.mediaRecorder.stop();
        this.isListening = false;
        this.updateStatus('processing', 'Processing...');
    }

    // Process audio using OpenAI Whisper
    async processAudio(audioBlob) {
        try {
            this.isProcessing = true;
            this.updateStatus('transcribing', 'Transcribing speech...');

            console.log('🎤 Audio blob size:', audioBlob.size, 'bytes');
            console.log('🎤 Audio blob type:', audioBlob.type);

            // Check if audio blob is valid
            if (audioBlob.size === 0) {
                throw new Error('Audio recording is empty. Please try speaking again.');
            }

            if (audioBlob.size < 1000) {
                throw new Error('Audio recording is too short. Please speak for longer.');
            }

            // Convert webm to a format Whisper accepts better
            // Try to use mp3 extension for better compatibility
            const formData = new FormData();

            // Whisper accepts various formats, let's try with the original format
            const fileName = audioBlob.type.includes('webm') ? 'audio.webm' :
                            audioBlob.type.includes('mp4') ? 'audio.mp4' :
                            audioBlob.type.includes('ogg') ? 'audio.ogg' :
                            'audio.webm';

            formData.append('file', audioBlob, fileName);
            formData.append('model', envConfig.get('OPENAI_WHISPER_MODEL', 'whisper-1'));
            formData.append('language', envConfig.get('VOICE_LANGUAGE', 'en-GB').split('-')[0]);

            console.log('🚀 Sending to Whisper API...');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${envConfig.get('OPENAI_API_KEY')}`
                },
                body: formData
            });

            console.log('📡 Whisper API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Whisper API error:', errorText);

                let errorMessage = 'Transcription failed';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error?.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('📝 Whisper response:', data);

            const transcript = data.text.trim();

            if (!transcript) {
                throw new Error('No speech detected. Please try again.');
            }

            console.log('✅ Transcript:', transcript);

            if (this.transcriptCallback) {
                this.transcriptCallback(transcript);
            }

            // Process the command
            await this.processCommand(transcript);

        } catch (error) {
            console.error('❌ Failed to process audio:', error);
            console.error('Error details:', error.message);
            this.updateStatus('error', 'Failed to process speech');

            let errorMessage = 'Sorry, I had trouble understanding that. Could you please try again?';
            if (error.message.includes('API key')) {
                errorMessage = 'API key error. Please check your OpenAI API key.';
            } else if (error.message.includes('empty') || error.message.includes('short')) {
                errorMessage = error.message;
            }

            await this.speak(errorMessage);
        } finally {
            this.isProcessing = false;
        }
    }

    // Process natural language command using GPT-4
    async processCommand(transcript) {
        try {
            // Check if we're in a multi-step conversation (e.g., on-hire/off-hire)
            if (typeof voiceControl !== 'undefined' && typeof voiceControl.continueConversation === 'function') {
                // Check if voice dashboard bridge has an active conversation
                if (typeof voiceDashboardBridge !== 'undefined' && voiceDashboardBridge.conversationState) {
                    console.log('🔄 Continuing multi-step conversation...');
                    this.updateStatus('processing', 'Processing your answer...');
                    const result = await voiceControl.continueConversation(transcript);

                    if (result && result.message) {
                        await this.speak(result.message);
                    }

                    // Check if we still need more info
                    if (result && result.needsMoreInfo) {
                        this.updateStatus('awaiting-more-info');
                        return;
                    }

                    this.updateStatus('idle');
                    return;
                }
            }

            this.updateStatus('thinking', 'Understanding your request...');

            // Build conversation context
            const messages = [
                {
                    role: 'system',
                    content: `You are ${envConfig.get('VOICE_ASSISTANT_NAME', 'Perimeter Assistant')}, a helpful voice assistant for the Perimeter Security admin dashboard.

Your job is to:
1. Understand user voice commands about their security maintenance business
2. Extract structured commands to query or modify data
3. Provide clear, concise voice responses
4. Prompt users for missing required information
5. Guide users through multi-step data entry

## AVAILABLE ACTIONS
You MUST use one of these exact action names in your response:

Scaffold Queries:
- count_on_hire: Count systems currently on hire
- count_off_hire: Count systems off hire (in stock)
- count_in_stock: Count systems in stock (same as count_off_hire)
- list_in_stock: List all systems in stock with details
- calculate_monthly_revenue: Calculate total monthly revenue
- calculate_weekly_revenue: Calculate total weekly revenue
- get_system_info: Get info about a specific system (requires pNumber)
- locate_system: Find where a system is located (requires pNumber)
- search_systems: Find systems by location/building type (requires searchTerm, optional exclude boolean)

Maintenance Queries:
- check_maintenance_due: Check maintenance due this month
- list_due_maintenances: List maintenance tasks due (same as check_maintenance_due)
- count_overdue_inspections: Count overdue inspections
- count_total_customers: Total number of customers
- count_nsi_customers: Count NSI certified customers

Data Analysis:
- analyze_data: Analyze data to answer analytical questions (requires question parameter with the full user question)

Scaffold Modifications:
- add_scaffold_system: Add new scaffold system
- install_scaffold_system: Install new system (same as add_scaffold_system)
- install_system: Install system (same as add_scaffold_system)
- update_hire_status: Change system hire status (requires either pNumber OR location, and status, optional offHireDate)
- update_system_details: Update any details on existing system (siteContact, appContact, address, etc.) - can use pNumber OR location
- update_contact_number: Update contact phone (requires pNumber, contactType, phoneNumber)

Maintenance Modifications:
- mark_inspection_complete: Mark inspection as complete (requires customerName)

## SCAFFOLD ALARM SYSTEMS (Scaff Tab)
REQUIRED Fields (* must have):
- pNumber*: P number (e.g. "P7", "P14") - unique identifier
- siteContact*: Customer/site name (e.g. "St Margarets Church", "John Smith")
- appContact*: Scaffolder/contractor (e.g. "1st Choice Scaffolding", "ABC Contractors")
- startDate*: Install/hire start date (defaults to today)
- lastInvoiceDate*: Last invoice date (defaults to today)
- hireStatus*: "on-hire" or "off-hire" (defaults to "on-hire")

OPTIONAL Fields (ask if user wants to add):
- extraSensors: Number of extra sensors (default 0, standard is 4 sensors)
- sitePhone: Site contact phone (UK mobile format)
- appPhone: App contact phone (UK mobile format)
- arcEnabled: true/false - Alarm Receiving Centre monitoring
- arcContact: ARC contact name (if ARC enabled)
- arcPhone: ARC phone number (if ARC enabled)
- location: Friendly name for site location

CALCULATED Fields (automatic):
- weeklyCost: (100 + extraSensors × 15) × 1.2 (inc VAT)
- monthlyCost: weeklyCost × 4

## MAINTENANCE CUSTOMERS (Maint Tab)
REQUIRED Fields:
- customerName*: Customer/business name
- address*: Full street address
- postcode*: UK postcode
- systemType*: "Intruder" or "CCTV"
- nsiStatus*: "NSI" or "Non-NSI" (default NSI)
- dateInstalled*: Original installation date
- inspectionsPerYear*: 1 or 2
- firstInspectionMonth*: 1-12 (January-December)

OPTIONAL Fields:
- secondInspectionMonth: 1-12 (only if inspectionsPerYear = 2)
- cloudId: Cloud service reference
- cloudRenewalDate: Cloud renewal date
- arcNo: ARC reference number
- arcRenewalDate: ARC contract renewal
- notes: Additional comments
- controlPanelBattery: Last control panel battery replacement date
- sirenBattery: Last siren battery replacement date
- detectorBatteries: Last detector batteries replacement date

For each user request, respond in JSON format:
{
  "intent": "query|modify|navigate|help|unclear",
  "action": "specific action to take",
  "parameters": { extracted parameters },
  "response": "what to say back to the user (empty string for multi-step flows)"
}

Examples:
- "How many systems on hire?" → {"intent":"query","action":"count_on_hire","parameters":{},"response":"Let me check how many scaffold systems are currently on hire."}
- "How many scaffold alarms in stock?" → {"intent":"query","action":"count_in_stock","parameters":{},"response":"Checking the current stock of scaffold alarms now."}
- "What systems are in stock?" → {"intent":"query","action":"list_in_stock","parameters":{},"response":"I'll list all systems currently in stock."}
- "Have I got any maintenance due this month?" → {"intent":"query","action":"check_maintenance_due","parameters":{},"response":"Let me check the maintenance schedule for this month."}
- "Where is P20?" → {"intent":"query","action":"locate_system","parameters":{"pNumber":"P20"},"response":"Let me find where P20 is located."}
- "How many scaffold alarms on church buildings?" → {"intent":"query","action":"search_systems","parameters":{"searchTerm":"church"},"response":"Let me search for scaffold systems at church locations."}
- "How many systems in Oxford?" → {"intent":"query","action":"search_systems","parameters":{"searchTerm":"oxford"},"response":"Searching for systems in Oxford now."}
- "How many systems outside Oxford?" → {"intent":"query","action":"search_systems","parameters":{"searchTerm":"oxford","exclude":true},"response":"Let me find systems outside Oxford."}
- "What's my busiest month for maintenances?" → {"intent":"query","action":"analyze_data","parameters":{"question":"What's my busiest month for maintenances?"},"response":"Let me analyze your maintenance schedule."}
- "What's the average revenue per scaffold system?" → {"intent":"query","action":"analyze_data","parameters":{"question":"What's the average revenue per scaffold system?"},"response":"Calculating average revenue now."}
- "Change P1 to off hire" → {"intent":"modify","action":"update_hire_status","parameters":{"pNumber":"P1","status":"off-hire"},"response":""}
- "The one at Royal Close Chippenham has come off hire" → {"intent":"modify","action":"update_hire_status","parameters":{"location":"Royal Close Chippenham","status":"off-hire"},"response":""}
- "The scaffold alarm at Royal Close Chippenham came off hire last Thursday" → {"intent":"modify","action":"update_hire_status","parameters":{"location":"Royal Close Chippenham","status":"off-hire","offHireDate":"last Thursday"},"response":""}
- "Put the church one back on hire" → {"intent":"modify","action":"update_hire_status","parameters":{"location":"church","status":"on-hire"},"response":""}
- "Update P9 site contact to Mark Murphy" → {"intent":"modify","action":"update_system_details","parameters":{"pNumber":"P9","siteContact":"Mark Murphy"},"response":""}
- "Update the site contact for the one at Oxford" → {"intent":"modify","action":"update_system_details","parameters":{"location":"Oxford","siteContact":""},"response":""}
- "Change P9 customer to First Choice Scaffolding" → {"intent":"modify","action":"update_system_details","parameters":{"pNumber":"P9","appContact":"First Choice Scaffolding"},"response":""}
- "I've installed P7 at St Margarets Church for 1st Choice Scaffolding" → {"intent":"modify","action":"install_system","parameters":{"pNumber":"P7","siteContact":"St Margarets Church","appContact":"1st Choice Scaffolding","address1":"St Margarets Church"},"response":""}
- "What's the total monthly revenue?" → {"intent":"query","action":"calculate_monthly_revenue","parameters":{},"response":"Calculating the total monthly revenue now."}

IMPORTANT:
- Always choose an action from the AVAILABLE ACTIONS list above
- Map user requests to the closest matching action even if they use different wording
- NEVER use "requiresConfirmation" - all actions execute immediately
- For modification actions, the system will ask for any missing information via multi-step conversation
- Keep responses empty ("response":"") for modification actions that start multi-step flows

ANALYTICAL QUESTIONS:
- If the user asks an analytical question that doesn't match a specific action (e.g., "busiest month", "average revenue"), use analyze_data
- Pass the ENTIRE user question as the "question" parameter so the analysis function can understand context
- Example: "Which month has the most inspections?" → analyze_data with question parameter
- This allows the system to intelligently answer questions by analyzing the database

ACTION SELECTION RULES:
- Use "update_hire_status" ONLY when changing hire status (on-hire ↔ off-hire)
  * Can use either pNumber ("P9") OR location ("Royal Close Chippenham", "the church one")
  * Extract location keywords from user's natural language (e.g., "the one at X" → location: "X")
  * Extract offHireDate if mentioned (e.g., "last Thursday", "yesterday", "16th October") - pass it exactly as said
- Use "update_system_details" when changing site contact, customer/app contact, address, phone numbers, or any other details
  * Can also use either pNumber OR location to identify the system

CONVERSATIONAL UPDATES:
- If user says "update the site contact" but doesn't provide the new value, include the parameter but set it to empty string ""
- This triggers a conversational flow to ask for the value
- Examples:
  * "Update P9 site contact" → {"parameters":{"pNumber":"P9","siteContact":""}}
  * "Change P9 site contact to Mark Murphy" → {"parameters":{"pNumber":"P9","siteContact":"Mark Murphy"}}
  * "Change P9 customer to First Choice" → {"parameters":{"pNumber":"P9","appContact":"First Choice"}}

Other examples:
  * "Put P1 on hire" → update_hire_status
  * "Mark P5 as off hire" → update_hire_status

Be conversational but concise. UK English spelling and phrasing.`
                }
            ];

            // Add conversation history if enabled
            if (envConfig.getBool('ENABLE_CONVERSATION_CONTEXT')) {
                const maxHistory = envConfig.getNumber('MAX_CONVERSATION_HISTORY', 10);
                messages.push(...this.conversationHistory.slice(-maxHistory));
            }

            // Add current user message
            messages.push({
                role: 'user',
                content: transcript
            });

            // Call OpenAI GPT-4
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${envConfig.get('OPENAI_API_KEY')}`
                },
                body: JSON.stringify({
                    model: envConfig.get('OPENAI_MODEL', 'gpt-4-turbo-preview'),
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'AI processing failed');
            }

            const data = await response.json();
            const commandData = JSON.parse(data.choices[0].message.content);

            if (envConfig.getBool('VOICE_DEBUG_MODE')) {
                console.log('🤖 Command parsed:', commandData);
            }

            // Update conversation history
            if (envConfig.getBool('ENABLE_CONVERSATION_CONTEXT')) {
                this.conversationHistory.push(
                    { role: 'user', content: transcript },
                    { role: 'assistant', content: data.choices[0].message.content }
                );
            }

            // Execute the command
            await this.executeCommand(commandData, transcript);

        } catch (error) {
            console.error('❌ Failed to process command:', error);
            await this.speak('Sorry, I encountered an error processing your request.');
            this.updateStatus('idle');
        }
    }

    // Execute the parsed command
    async executeCommand(commandData, transcript = '') {
        try {
            const { intent, action, parameters, response } = commandData;

            // Store transcript for logging
            commandData.transcript = transcript;

            // Start conversation tracking
            if (typeof voiceLogger !== 'undefined') {
                voiceLogger.startConversation(transcript, intent, action);
            }

            // Handle unclear commands
            if (intent === 'unclear' || intent === 'help') {
                await this.speak(response);
                if (typeof voiceLogger !== 'undefined') {
                    voiceLogger.addConversationStep({
                        type: 'info',
                        transcript,
                        action: 'help',
                        result: response
                    });
                    voiceLogger.endConversation({ success: true, message: response });
                }
                this.updateStatus('idle');
                return;
            }

            // Speak the initial response
            await this.speak(response);

            if (typeof voiceLogger !== 'undefined') {
                voiceLogger.addConversationStep({
                    type: 'acknowledged',
                    action,
                    parameters,
                    result: response
                });
            }

            // Execute the action
            this.updateStatus('executing', 'Executing command...');

            let result;
            let handled = true;

            switch (action) {
                // Scaff queries
                case 'count_on_hire':
                    result = await this.queryOnHireCount();
                    break;
                case 'count_off_hire':
                    result = await this.queryOffHireCount();
                    break;
                case 'count_in_stock':
                    result = await this.countInStock();
                    break;
                case 'list_in_stock':
                    result = await this.listInStock();
                    break;
                case 'calculate_monthly_revenue':
                    result = await this.queryMonthlyRevenue();
                    break;
                case 'calculate_weekly_revenue':
                    result = await this.queryWeeklyRevenue();
                    break;

                // Customer queries
                case 'count_overdue_inspections':
                    result = await this.queryOverdueInspections();
                    break;
                case 'count_total_customers':
                    result = await this.queryTotalCustomers();
                    break;
                case 'count_nsi_customers':
                    result = await this.queryNSICustomers();
                    break;
                case 'check_maintenance_due':
                case 'list_due_maintenances':
                    result = await this.checkMaintenanceDue(parameters);
                    break;

                // System info
                case 'get_system_info':
                    result = await this.getSystemInfo(parameters);
                    break;
                case 'locate_system':
                    result = await this.locateSystem(parameters);
                    break;
                case 'search_systems':
                    result = await this.searchSystems(parameters);
                    break;

                // Data Analysis
                case 'analyze_data':
                    result = await this.analyzeData(parameters);
                    break;

                // Modifications
                case 'add_scaffold_system':
                case 'install_scaffold_system':
                case 'install_system':
                    result = await this.addScaffoldSystem(parameters);
                    break;
                case 'update_hire_status':
                    result = await this.updateHireStatus(parameters);
                    break;
                case 'update_system_details':
                    result = await this.updateSystemDetails(parameters);
                    break;
                case 'update_contact_number':
                    result = await this.updateContactNumber(parameters);
                    break;
                case 'mark_inspection_complete':
                    result = await this.markInspectionComplete(parameters);
                    break;

                default:
                    result = { success: false, message: 'I\'m not sure how to do that yet.' };
                    handled = false;

                    // Log unhandled command
                    if (typeof voiceLogger !== 'undefined') {
                        voiceLogger.logUnhandled(
                            commandData.transcript || 'Unknown',
                            action,
                            intent,
                            parameters
                        );
                    }
            }

            // Speak the result
            if (result && result.message) {
                await this.speak(result.message);
            }

            // Handle cases where more info is needed
            if (result && result.needsMoreInfo) {
                if (typeof voiceLogger !== 'undefined') {
                    voiceLogger.addConversationStep({
                        type: 'needs_more_info',
                        action,
                        missingFields: result.missingFields,
                        result: result.message
                    });
                }
                // System is waiting for user to provide more info
                // Next voice command should continue this conversation
                this.updateStatus('awaiting-more-info');
                return;
            }

            // Handle follow-up questions (like asking about ARC)
            if (result && result.askAboutARC) {
                if (typeof voiceLogger !== 'undefined') {
                    voiceLogger.addConversationStep({
                        type: 'follow_up_question',
                        action,
                        result: result.message
                    });
                }
            }

            // Log success
            if (handled && result.success && typeof voiceLogger !== 'undefined') {
                voiceLogger.logSuccess(
                    commandData.transcript || 'Unknown',
                    action,
                    result
                );
            }

            this.updateStatus('idle');

        } catch (error) {
            console.error('❌ Failed to execute command:', error);
            await this.speak('Sorry, something went wrong while executing that command.');
            this.updateStatus('idle');
        }
    }

    // Text-to-Speech using ElevenLabs or Browser API
    async speak(text) {
        if (!text || !envConfig.getBool('ENABLE_VOICE_FEEDBACK')) {
            return;
        }

        try {
            this.isSpeaking = true;
            this.updateStatus('speaking', text);

            const ttsProvider = envConfig.get('TTS_PROVIDER', 'browser');

            if (ttsProvider === 'elevenlabs' && envConfig.get('ELEVENLABS_API_KEY')) {
                await this.speakElevenLabs(text);
            } else {
                await this.speakBrowser(text);
            }

        } catch (error) {
            console.error('❌ Failed to speak:', error);
            // Fallback to browser TTS
            try {
                await this.speakBrowser(text);
            } catch (fallbackError) {
                console.error('❌ Browser TTS also failed:', fallbackError);
            }
        } finally {
            this.isSpeaking = false;
        }
    }

    // ElevenLabs TTS
    async speakElevenLabs(text) {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${envConfig.get('ELEVENLABS_VOICE_ID')}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': envConfig.get('ELEVENLABS_API_KEY')
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            throw new Error('ElevenLabs TTS failed');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        return new Promise((resolve, reject) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.onerror = (error) => {
                URL.revokeObjectURL(audioUrl);
                reject(error);
            };

            // Try to play, but properly handle errors
            audio.play().catch((error) => {
                URL.revokeObjectURL(audioUrl);
                // Only ignore autoplay policy errors, reject others (like blob URL security errors)
                if (error.name === 'NotAllowedError') {
                    resolve(); // Autoplay blocked - continue silently
                } else {
                    reject(error); // Other errors should trigger fallback to browser TTS
                }
            });
        });
    }

    // Browser TTS fallback
    async speakBrowser(text) {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);

            // Configure voice
            const voices = speechSynthesis.getVoices();
            const preferredVoice = envConfig.get('BROWSER_TTS_VOICE');
            const voice = voices.find(v => v.name.includes(preferredVoice)) ||
                         voices.find(v => v.lang.startsWith('en-GB')) ||
                         voices[0];

            if (voice) utterance.voice = voice;

            utterance.rate = envConfig.getNumber('TTS_SPEECH_RATE', 1.0);
            utterance.pitch = envConfig.getNumber('TTS_SPEECH_PITCH', 1.0);
            utterance.volume = envConfig.getNumber('TTS_SPEECH_VOLUME', 1.0);

            utterance.onend = resolve;
            utterance.onerror = reject;

            speechSynthesis.speak(utterance);
        });
    }

    // Query methods - these will be called from the dashboard
    async queryOnHireCount() {
        // Will be implemented to connect to dashboard data
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async queryMonthlyRevenue() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async queryWeeklyRevenue() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async queryOffHireCount() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async countInStock() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async listInStock() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async queryOverdueInspections() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async checkMaintenanceDue(params) {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async queryTotalCustomers() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async queryNSICustomers() {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async updateHireStatus(params) {
        return { success: true, message: 'Update not yet connected to dashboard data' };
    }

    async updateContactNumber(params) {
        return { success: true, message: 'Update not yet connected to dashboard data' };
    }

    async getSystemInfo(params) {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async locateSystem(params) {
        return { success: true, message: 'Query not yet connected to dashboard data' };
    }

    async addScaffoldSystem(params) {
        return { success: true, message: 'Modification not yet connected to dashboard data' };
    }

    async markInspectionComplete(params) {
        return { success: true, message: 'Modification not yet connected to dashboard data' };
    }

    // Clear conversation history
    clearHistory() {
        this.conversationHistory = [];
    }

    // Stop any ongoing operations
    stop() {
        if (this.isListening) {
            this.stopListening();
        }
        if (this.isSpeaking) {
            speechSynthesis.cancel();
            this.isSpeaking = false;
        }
        this.updateStatus('idle');
    }
}

// Create global instance
const voiceControl = new VoiceControl();
