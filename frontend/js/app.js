/**
 * Orbit Meeting - Main Application Entry Point
 * LiveKit-powered video conferencing interface
 */

class OrbitMeeting {
    constructor() {
        this.roomName = this.getRoomFromURL() || this.generateRoomName();
        this.userIdentity = this.getUserIdentity() || this.generateUserName();
        this.isConnected = false;
    }

    getRoomFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room') || params.get('roomName');
    }

    getUserIdentity() {
        const params = new URLSearchParams(window.location.search);
        return params.get('name') || params.get('identity');
    }

    generateRoomName() {
        const adjectives = ['cosmic', 'stellar', 'orbital', 'lunar', 'solar', 'nebula', 'aurora', 'quantum'];
        const nouns = ['summit', 'sync', 'connect', 'hub', 'space', 'orbit', 'nexus', 'grid'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        return `${adj}-${noun}-${num}`;
    }

    generateUserName() {
        const prefixes = ['space', 'star', 'nova', 'astro', 'cosmo', 'galaxy'];
        const suffixes = ['user', 'dev', 'pro', 'pilot', 'naut', 'traveler'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const num = Math.floor(Math.random() * 100);
        return `${prefix}-${suffix}-${num}`;
    }

    async init() {
        console.log('Initializing Orbit Meeting...', { room: this.roomName, user: this.userIdentity });
        
        uiController.initializeEventListeners();
        uiController.updateRoomName(this.roomName);
        uiController.updateConnectionStatus('connecting');

        this.setupEventListeners();
        
        await this.connectToRoom();
    }

    setupEventListeners() {
        liveKitManager.on('connectionStateChanged', (state) => {
            this.handleConnectionState(state);
        });

        liveKitManager.on('participantJoined', (participant) => {
            console.log('Participant joined:', participant.identity);
            uiController.updateParticipantsList();
        });

        liveKitManager.on('participantLeft', (participant) => {
            console.log('Participant left:', participant.identity);
            uiController.removeVideoParticipant(participant.sid);
        });

        liveKitManager.on('trackSubscribed', ({ track, participant }) => {
            console.log('Track subscribed:', track.kind, participant.identity);
            if (track.kind === window.LivekitClient.Track.Kind.Video) {
                uiController.renderVideoParticipant(participant);
            }
        });

        liveKitManager.on('trackUnsubscribed', ({ track, participant }) => {
            console.log('Track unsubscribed:', track.kind, participant.identity);
            if (track.kind === window.LivekitClient.Track.Kind.Video) {
                uiController.renderVideoParticipant(participant);
            }
        });

        liveKitManager.on('dataReceived', (payload) => {
            this.handleDataReceived(payload);
        });

        liveKitManager.on('speakingChanged', (speakers) => {
            this.updateSpeakingIndicators(speakers);
        });
    }

    async connectToRoom() {
        try {
            const response = await apiClient.getToken(this.userIdentity, this.roomName);
            
            await liveKitManager.connect(response.url, response.token, this.roomName);
            
            this.isConnected = true;
            uiController.updateConnectionStatus('connected');
            uiController.hideVideoPlaceholder();
            
            this.renderLocalParticipant();
            uiController.updateParticipantsList();
            
            console.log('Connected to room:', this.roomName);
        } catch (error) {
            console.error('Failed to connect:', error);
            uiController.updateConnectionStatus('disconnected');
            this.showError('Failed to connect to meeting. Please check your connection.');
        }
    }

    renderLocalParticipant() {
        const participant = liveKitManager.localParticipant;
        if (participant) {
            uiController.renderVideoParticipant(participant);
        }
    }

    handleConnectionState(state) {
        switch (state) {
            case 'connected':
                this.isConnected = true;
                uiController.updateConnectionStatus('connected');
                break;
            case 'connecting':
            case 'reconnecting':
                uiController.updateConnectionStatus('connecting');
                break;
            case 'disconnected':
                this.isConnected = false;
                uiController.updateConnectionStatus('disconnected');
                break;
        }
    }

    handleDataReceived(payload) {
        try {
            const decoder = new TextDecoder();
            const data = JSON.parse(decoder.decode(payload.data));
            
            switch (data.type) {
                case 'chat':
                    uiController.addChatMessage(data.sender, data.message);
                    break;
                case 'reaction':
                    uiController.showReaction(data.emoji);
                    break;
                case 'hand_raise':
                    console.log('Hand raise from:', data.sender, 'raised:', data.raised);
                    break;
                case 'lock_meeting':
                    this.showNotification('Meeting has been locked', 'info');
                    break;
                case 'end_meeting':
                    this.showNotification('Meeting ended by host', 'info');
                    setTimeout(() => window.location.href = '/', 2000);
                    break;
            }
        } catch (error) {
            console.error('Failed to parse data packet:', error);
        }
    }

    updateSpeakingIndicators(speakers) {
        const speakerIds = new Set(speakers.map(s => s.sid));
        document.querySelectorAll('.video-frame').forEach(frame => {
            const sid = frame.id.replace('video-', '');
            const indicator = frame.querySelector('.speaking-indicator') || document.createElement('div');
            indicator.className = 'speaking-indicator';
            indicator.innerHTML = '<i class="fa-solid fa-waveform-lines"></i>';
            
            if (speakerIds.has(sid)) {
                if (!frame.querySelector('.speaking-indicator')) {
                    frame.appendChild(indicator);
                }
            } else {
                indicator.remove();
            }
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'modal-overlay show';
        errorDiv.innerHTML = `
            <div class="modal">
                <h3>Connection Error</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
                <button class="modal-btn secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    showNotification(message, type = 'info') {
        console.log(`[${type}] ${message}`);
    }
}

const orbitMeeting = new OrbitMeeting();

document.addEventListener('DOMContentLoaded', () => {
    orbitMeeting.init();
});

window.addEventListener('beforeunload', () => {
    if (orbitMeeting.isConnected) {
        liveKitManager.disconnect();
    }
});
