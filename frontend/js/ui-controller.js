/**
 * UI Controller - Manages all UI interactions and state
 */

class UIController {
    constructor() {
        this.state = {
            isMicEnabled: true,
            isCamEnabled: false,
            isSidebarOpen: false,
            participants: new Map(),
        };
    }

    updateRoomName(roomName) {
        document.getElementById('roomNameDisplay').textContent = roomName;
    }

    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        const textEl = document.getElementById('connectionStatusText');
        
        if (!statusEl || !textEl) return;
        
        statusEl.className = 'status-indicator ' + status;
        
        const statusMap = {
            'connected': 'Connected',
            'connecting': 'Connecting...',
            'disconnected': 'Disconnected'
        };
        textEl.textContent = statusMap[status] || status;
    }

    hideVideoPlaceholder() {
        const placeholder = document.getElementById('videoPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
    }

    renderLocalParticipant(userId) {
        const grid = document.getElementById('videoGrid');
        if (!grid) return;
        
        const existing = document.getElementById('participant-' + userId);
        if (existing) return;

        const frame = document.createElement('div');
        frame.className = 'participant-frame';
        frame.id = 'participant-' + userId;
        frame.innerHTML = `
            <div class="participant-video" id="video-${userId}">
                <div class="video-off">
                    <i class="fa-solid fa-user"></i>
                </div>
            </div>
            <div class="participant-info">
                <span class="participant-name">${userId}</span>
                <span class="participant-badge">You</span>
            </div>
        `;
        grid.appendChild(frame);
    }

    renderVideoParticipant(participantId) {
        const grid = document.getElementById('videoGrid');
        if (!grid) return;
        
        const existing = document.getElementById('participant-' + participantId);
        if (existing) return;

        const frame = document.createElement('div');
        frame.className = 'participant-frame';
        frame.id = 'participant-' + participantId;
        frame.innerHTML = `
            <div class="participant-video" id="video-${participantId}">
                <div class="video-off">
                    <i class="fa-solid fa-user"></i>
                </div>
            </div>
            <div class="participant-info">
                <span class="participant-name">${participantId}</span>
            </div>
        `;
        grid.appendChild(frame);
    }

    removeVideoParticipant(participantId) {
        const frame = document.getElementById('participant-' + participantId);
        if (frame) frame.remove();
    }

    updateParticipantsList() {
        const list = document.getElementById('participantsList');
        const count = document.getElementById('participantCount');
        
        if (count) count.textContent = this.state.participants.size + 1 + ' participants';
    }

    addChatMessage(sender, message) {
        const container = document.getElementById('pane-chat');
        if (!container) return;
        
        const msg = document.createElement('div');
        msg.className = 'chat-message';
        msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    initializeEventListeners() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        
        sendBtn?.addEventListener('click', () => this.sendChat());
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChat();
        });

        const btnMic = document.getElementById('btn-mic');
        const btnCam = document.getElementById('btn-cam');
        const btnEnd = document.getElementById('btn-end');
        
        btnMic?.addEventListener('click', () => this.toggleMic());
        btnCam?.addEventListener('click', () => this.toggleCamera());
        btnEnd?.addEventListener('click', () => this.endCall());
    }

    async toggleMic() {
        this.state.isMicEnabled = !this.state.isMicEnabled;
        await orbitMeeting?.toggleMic(this.state.isMicEnabled);
        
        const btn = document.getElementById('btn-mic');
        if (btn) {
            btn.classList.toggle('off', !this.state.isMicEnabled);
            btn.querySelector('i').className = 
                this.state.isMicEnabled ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash';
        }
    }

    async toggleCamera() {
        this.state.isCamEnabled = !this.state.isCamEnabled;
        await orbitMeeting?.toggleCamera(this.state.isCamEnabled);
        
        const btn = document.getElementById('btn-cam');
        if (btn) {
            btn.classList.toggle('off', !this.state.isCamEnabled);
            btn.querySelector('i').className = 
                this.state.isCamEnabled ? 'fa-solid fa-video' : 'fa-solid fa-video-slash';
        }
    }

    sendChat() {
        const input = document.getElementById('chatInput');
        const message = input?.value.trim();
        if (!message) return;
        
        orbitMeeting?.sendChatMessage(message);
        this.addChatMessage('You', message);
        if (input) input.value = '';
    }

    endCall() {
        orbitMeeting?.disconnect();
        window.location.href = '/';
    }
}

const uiController = new UIController();
