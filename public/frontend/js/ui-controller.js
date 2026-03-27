/**
 * UI Controller - Manages all UI interactions and state
 */

class UIController {
    constructor() {
        this.state = {
            isMicEnabled: true,
            isCamEnabled: true,
            isScreenSharing: false,
            isHandRaised: false,
            isSidebarOpen: false,
            layout: 'tile',
            isRecording: false,
            isTranslationEnabled: false,
        };
    }

    cacheElements() {
        return {
            sidebar: document.getElementById('sidebar'),
            sidebarTitle: document.getElementById('sidebar-title'),
            sidebarInputArea: document.getElementById('sidebar-input-area'),
            chatInput: document.getElementById('chatInput'),
            sendChatBtn: document.getElementById('sendChatBtn'),
            chatMessages: document.getElementById('pane-chat'),
            participantsList: document.getElementById('participantsList'),
            participantCount: document.getElementById('participantCount'),
            transcriptList: document.getElementById('transcriptList'),
            videoGrid: document.getElementById('videoGrid'),
            videoPlaceholder: document.getElementById('videoPlaceholder'),
            tileViewBtn: document.getElementById('tileViewBtn'),
            btnMic: document.getElementById('btn-mic'),
            btnCam: document.getElementById('btn-cam'),
            roomNameDisplay: document.getElementById('roomNameDisplay'),
            connectionStatus: document.getElementById('connectionStatus'),
            connectionStatusText: document.getElementById('connectionStatusText'),
            infoMeetingName: document.getElementById('infoMeetingName'),
            infoHostName: document.getElementById('infoHostName'),
            infoLink: document.getElementById('infoLink'),
            micList: document.getElementById('micList'),
            speakerList: document.getElementById('speakerList'),
            cameraList: document.getElementById('cameraList'),
            handRaiseBtn: document.querySelector('.raise-hand-btn'),
        };
    }

    initializeEventListeners() {
        const el = this.cacheElements();
        
        el.sendChatBtn?.addEventListener('click', () => this.sendChat());
        el.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChat();
        });

        document.addEventListener('click', (e) => {
            const isClickInsideMenu = e.target.closest('.popup-menu');
            const isClickOnTrigger = e.target.closest('.btn-wrapper') || e.target.closest('.split-btn');
            if (!isClickInsideMenu && !isClickOnTrigger) {
                this.closeAllMenus();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllMenus();
                this.closeSidebar();
            }
        });
    }

    closeAllMenus() {
        document.querySelectorAll('.popup-menu').forEach(m => m.classList.remove('show'));
    }

    toggleMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (!menu) return;
        
        const isShowing = menu.classList.contains('show');
        this.closeAllMenus();
        
        if (!isShowing) {
            menu.classList.add('show');
            
            if (menuId === 'audio-menu') this.populateAudioDevices();
            if (menuId === 'video-menu') this.populateVideoDevices();
        }
    }

    async populateAudioDevices() {
        const el = this.cacheElements();
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const mics = devices.filter(d => d.kind === 'audioinput');
            const speakers = devices.filter(d => d.kind === 'audiooutput');

            el.micList.innerHTML = mics.map(m => `
                <button class="popup-item" onclick="uiController.selectMic('${m.deviceId}')">
                    <i class="fa-solid fa-microphone"></i> ${m.label || 'Microphone'}
                </button>
            `).join('');

            el.speakerList.innerHTML = speakers.map(s => `
                <button class="popup-item" onclick="uiController.selectSpeaker('${s.deviceId}')">
                    <i class="fa-solid fa-volume-high"></i> ${s.label || 'Speaker'}
                </button>
            `).join('');
        } catch (err) {
            console.error('Failed to enumerate devices:', err);
        }
    }

    async populateVideoDevices() {
        const el = this.cacheElements();
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(d => d.kind === 'videoinput');

            el.cameraList.innerHTML = cameras.map(c => `
                <button class="popup-item" onclick="uiController.selectCamera('${c.deviceId}')">
                    <i class="fa-solid fa-video"></i> ${c.label || 'Camera'}
                </button>
            `).join('');
        } catch (err) {
            console.error('Failed to enumerate devices:', err);
        }
    }

    selectMic(deviceId) {
        liveKitManager?.switchAudioDevice(deviceId);
        this.closeAllMenus();
    }

    selectSpeaker(deviceId) {
        liveKitManager?.switchAudioOutput(deviceId);
        this.closeAllMenus();
    }

    selectCamera(deviceId) {
        liveKitManager?.switchVideoDevice(deviceId);
        this.closeAllMenus();
    }

    async toggleMicrophone() {
        try {
            const newState = !this.state.isMicEnabled;
            await liveKitManager?.toggleMicrophone(newState);
            this.state.isMicEnabled = newState;
            this.updateMicButton();
        } catch (err) {
            console.error('Failed to toggle mic:', err);
        }
    }

    async toggleCamera() {
        try {
            const newState = !this.state.isCamEnabled;
            await liveKitManager?.toggleCamera(newState);
            this.state.isCamEnabled = newState;
            this.updateCamButton();
        } catch (err) {
            console.error('Failed to toggle camera:', err);
        }
    }

    updateMicButton() {
        const el = this.cacheElements();
        const icon = el.btnMic.querySelector('i');
        
        if (this.state.isMicEnabled) {
            icon.className = 'fa-solid fa-microphone';
            el.btnMic.classList.remove('danger-state');
        } else {
            icon.className = 'fa-solid fa-microphone-slash';
            el.btnMic.classList.add('danger-state');
        }
    }

    updateCamButton() {
        const el = this.cacheElements();
        const icon = el.btnCam.querySelector('i');
        
        if (this.state.isCamEnabled) {
            icon.className = 'fa-solid fa-video';
            el.btnCam.classList.remove('danger-state');
        } else {
            icon.className = 'fa-solid fa-video-slash';
            el.btnCam.classList.add('danger-state');
        }
    }

    async toggleScreenShare() {
        const btn = document.querySelector('[title="Share your screen"]');
        
        if (!this.state.isScreenSharing) {
            this.toggleMenu('share-menu');
        } else {
            await liveKitManager?.stopScreenShare();
            this.state.isScreenSharing = false;
            btn.classList.remove('toggled-on');
        }
    }

    async startScreenShare(type) {
        try {
            const constraints = {
                screen: { video: { cursor: 'always' }, audio: false },
                window: { video: { cursor: 'always', displaySurface: 'window' }, audio: false },
                browser: { video: { cursor: 'always', displaySurface: 'browser' }, audio: false },
            };

            await liveKitManager?.startScreenShare(constraints[type] || constraints.screen);
            this.state.isScreenSharing = true;
            
            const btn = document.querySelector('[title="Share your screen"]');
            btn.classList.add('toggled-on');
            this.closeAllMenus();
        } catch (err) {
            console.error('Screen share failed:', err);
        }
    }

    sendReaction(emoji) {
        liveKitManager?.sendDataPacket({ type: 'reaction', emoji });
        this.showReaction(emoji);
        this.closeAllMenus();
    }

    showReaction(emoji) {
        const overlay = document.createElement('div');
        overlay.className = 'reaction-overlay';
        overlay.textContent = emoji;
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 2000);
    }

    toggleHandRaise() {
        this.state.isHandRaised = !this.state.isHandRaised;
        const btn = document.querySelector('.raise-hand-btn');
        if (btn) btn.classList.toggle('active', this.state.isHandRaised);
        
        liveKitManager?.sendDataPacket({ type: 'hand_raise', raised: this.state.isHandRaised });
        this.closeAllMenus();
    }

    sendChat() {
        const el = this.cacheElements();
        const message = el.chatInput?.value.trim();
        if (!message) return;

        liveKitManager?.sendChatMessage(message);
        this.addChatMessage('You', message);
        if (el.chatInput) el.chatInput.value = '';
    }

    addChatMessage(sender, text) {
        const el = this.cacheElements();
        if (!el.chatMessages) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msg = document.createElement('div');
        msg.className = 'chat-msg';
        msg.innerHTML = `<span>${sender} - ${time}</span>${this.escapeHtml(text)}`;
        el.chatMessages.appendChild(msg);
        el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
    }

    addTranscriptLine(speaker, text, timestamp) {
        const el = this.cacheElements();
        if (!el.transcriptList) return;

        const line = document.createElement('div');
        line.className = 'transcript-line';
        line.innerHTML = `<strong>${this.escapeHtml(speaker)}</strong>${this.escapeHtml(text)}`;
        el.transcriptList.appendChild(line);
        el.transcriptList.scrollTop = el.transcriptList.scrollHeight;
    }

    openSidebar(title, paneId, showInput) {
        const el = this.cacheElements();
        
        el.sidebarTitle.textContent = title;
        
        document.querySelectorAll('.sidebar-content').forEach(pane => pane.classList.remove('active'));
        document.getElementById(paneId)?.classList.add('active');
        
        if (paneId === 'pane-participants') {
            this.updateParticipantsList();
        }
        
        el.sidebarInputArea.classList.toggle('visible', showInput);
        el.sidebar.classList.add('open');
        this.state.isSidebarOpen = true;
    }

    closeSidebar() {
        const el = this.cacheElements();
        el.sidebar.classList.remove('open');
        this.state.isSidebarOpen = false;
    }

    toggleTileView() {
        const el = this.cacheElements();
        this.state.layout = this.state.layout === 'tile' ? 'speaker' : 'tile';
        el.videoGrid.classList.toggle('tile-view', this.state.layout === 'tile');
        el.videoGrid.classList.toggle('speaker-view', this.state.layout === 'speaker');
        el.tileViewBtn.classList.toggle('toggled-on', this.state.layout === 'speaker');
    }

    updateParticipantsList() {
        const el = this.cacheElements();
        const participants = liveKitManager?.getAllParticipants() || [];
        
        el.participantCount.textContent = participants.length;
        
        el.participantsList.innerHTML = participants.map(p => {
            const isMuted = !p.isMicrophoneEnabled;
            const isLocal = p.isLocal;
            return `
                <div class="participant-item">
                    <span class="name">
                        <i class="fa-solid fa-user" style="color:#888;"></i>
                        ${p.identity}${isLocal ? ' (You)' : ''}
                    </span>
                    <span class="icons ${isMuted ? 'muted' : ''}">
                        <i class="fa-solid fa-microphone${isMuted ? '-slash' : ''}"></i>
                    </span>
                </div>
            `;
        }).join('');
    }

    updateRoomName(name) {
        const el = this.cacheElements();
        if (el.roomNameDisplay) el.roomNameDisplay.textContent = `Room: ${name}`;
        if (el.infoMeetingName) el.infoMeetingName.textContent = `Orbit Meeting: ${name}`;
        if (el.infoLink) el.infoLink.textContent = `${window.location.origin}?room=${name}`;
    }

    copyMeetingLink() {
        const link = `${window.location.origin}?room=${new URLSearchParams(window.location.search).get('room')}`;
        navigator.clipboard.writeText(link);
        this.closeAllMenus();
        this.showNotification('Link copied!', 'success');
    }

    lockMeeting() {
        liveKitManager?.sendDataPacket({ type: 'lock_meeting' });
        this.showNotification('Meeting locked', 'info');
        this.closeAllMenus();
    }

    toggleWaitingRoom() {
        liveKitManager?.sendDataPacket({ type: 'toggle_waiting_room' });
        this.closeAllMenus();
    }

    togglePermission(permission) {
        this.closeAllMenus();
    }

    startRecording(type) {
        this.state.isRecording = !this.state.isRecording;
        const btn = document.querySelector('[title="Start recording"]');
        btn.classList.toggle('toggled-on', this.state.isRecording);
        this.showNotification(this.state.isRecording ? 'Recording started' : 'Recording stopped', 'info');
        this.closeAllMenus();
    }

    openWhiteboard(type) {
        this.closeAllMenus();
        window.open('/whiteboard.html', '_blank');
    }

    showAudioSettings() {
        this.closeAllMenus();
    }

    showVideoSettings() {
        this.closeAllMenus();
    }

    showVirtualBackground() {
        this.closeAllMenus();
    }

    showLeaveModal() {
        document.getElementById('leave-modal')?.classList.add('show');
    }

    closeLeaveModal() {
        document.getElementById('leave-modal')?.classList.remove('show');
    }

    async leaveMeeting() {
        await liveKitManager?.disconnect();
        window.location.href = window.location.pathname;
    }

    async endMeetingForAll() {
        liveKitManager?.sendDataPacket({ type: 'end_meeting' });
        await liveKitManager?.disconnect();
        window.location.href = window.location.pathname;
    }

    updateConnectionStatus(status) {
        const el = this.cacheElements();
        el.connectionStatus.classList.add('visible');
        el.connectionStatus.classList.remove('connecting', 'connected', 'disconnected');
        el.connectionStatus.classList.add(status);

        const messages = {
            connecting: 'Connecting...',
            connected: '✓ Connected',
            disconnected: '✕ Disconnected'
        };

        el.connectionStatusText.textContent = messages[status] || status;
        
        if (status === 'connected') {
            setTimeout(() => el.connectionStatus.classList.remove('visible'), 3000);
        }
    }

    hideVideoPlaceholder() {
        const el = this.cacheElements();
        if (el.videoPlaceholder) el.videoPlaceholder.style.display = 'none';
    }

    showVideoPlaceholder() {
        const el = this.cacheElements();
        if (el.videoPlaceholder) el.videoPlaceholder.style.display = 'flex';
    }

    renderVideoParticipant(participant) {
        const el = this.cacheElements();
        let frame = document.getElementById(`video-${participant.sid}`);
        
        if (!frame) {
            frame = document.createElement('div');
            frame.id = `video-${participant.sid}`;
            frame.className = 'video-frame';
            el.videoGrid.appendChild(frame);
        }

        frame.innerHTML = '';

        const videoTrack = Array.from(participant.videoTracks.values())[0];
        if (videoTrack?.track) {
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsinline = true;
            if (participant.isLocal) video.muted = true;
            videoTrack.track.attach(video);
            frame.appendChild(video);
        } else {
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
            frame.appendChild(avatar);
        }

        const label = document.createElement('div');
        label.className = 'user-label';
        label.textContent = participant.identity;
        frame.appendChild(label);

        if (!participant.isMicrophoneEnabled) {
            const muteIndicator = document.createElement('div');
            muteIndicator.className = 'mute-indicator';
            muteIndicator.textContent = 'MUTED';
            frame.appendChild(muteIndicator);
        }

        this.updateParticipantsList();
    }

    removeVideoParticipant(participantSid) {
        const frame = document.getElementById(`video-${participantSid}`);
        if (frame) frame.remove();
        this.updateParticipantsList();
    }

    showNotification(message, type = 'info') {
        console.log(`[${type}] ${message}`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const uiController = new UIController();
