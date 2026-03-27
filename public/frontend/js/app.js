/**
 * Orbit Meeting - Main Application Entry Point
 * Stream-powered video conferencing interface
 */

class OrbitMeeting {
    constructor() {
        this.roomId = this.getRoomFromURL() || this.generateRoomName();
        this.userId = this.getUserId() || this.generateUserName();
        this.isConnected = false;
        this.client = null;
        this.call = null;
    }

    getRoomFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('room') || params.get('roomId');
    }

    getUserId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('name') || params.get('userId');
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
        console.log('Initializing Orbit Meeting...', { room: this.roomId, user: this.userId });
        
        uiController.initializeEventListeners();
        uiController.updateRoomName(this.roomId);
        uiController.updateConnectionStatus('connecting');

        await this.connectToRoom();
    }

    async connectToRoom() {
        try {
            const response = await apiClient.getToken(this.userId, this.roomId);
            
            const { StreamVideoClient } = window.StreamVideo;
            
            this.client = new StreamVideoClient({
                apiKey: response.api_key,
                user: { id: response.user_id },
                token: response.token,
            });

            this.call = this.client.call("default", response.room_id);

            await this.call.join({ create: true });

            this.isConnected = true;
            uiController.updateConnectionStatus('connected');
            uiController.hideVideoPlaceholder();
            uiController.updateParticipantsList();
            uiController.renderLocalParticipant(this.userId);
            
            this.setupCallListeners();
            
            console.log('Connected to room:', this.roomId);
        } catch (error) {
            console.error('Failed to connect:', error);
            uiController.updateConnectionStatus('disconnected');
            this.showError('Failed to connect to meeting. Please check your connection.');
        }
    }

    setupCallListeners() {
        if (!this.call) return;

        this.call.on("call.lifecycle.user_joined", (event) => {
            console.log('User joined:', event.user.id);
            uiController.renderVideoParticipant(event.user.id);
            uiController.updateParticipantsList();
        });

        this.call.on("call.lifecycle.user_left", (event) => {
            console.log('User left:', event.user.id);
            uiController.removeVideoParticipant(event.user.id);
            uiController.updateParticipantsList();
        });

        this.call.on("member.joined", (event) => {
            console.log('Member joined:', event.member.user.id);
            uiController.updateParticipantsList();
        });

        this.call.on("member.left", (event) => {
            console.log('Member left:', event.member.user.id);
            uiController.updateParticipantsList();
        });
    }

    async toggleMic(enabled) {
        if (!this.call) return;
        await this.call.muteAudio(!enabled);
    }

    async toggleCamera(enabled) {
        if (!this.call) return;
        await this.call.muteVideo(!enabled);
    }

    sendChatMessage(message) {
        if (!this.call) return;
        this.call.sendCustomEvent({ type: 'chat', message, sender: this.userId });
    }

    disconnect() {
        if (this.call) {
            this.call.leave();
            this.call = null;
        }
        if (this.client) {
            this.client.disconnect();
            this.client = null;
        }
        this.isConnected = false;
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
}

const orbitMeeting = new OrbitMeeting();

document.addEventListener('DOMContentLoaded', () => {
    orbitMeeting.init();
});

window.addEventListener('beforeunload', () => {
    if (orbitMeeting.isConnected) {
        orbitMeeting.disconnect();
    }
});
