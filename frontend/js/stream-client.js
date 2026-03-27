/**
 * Stream video client wrapper
 */

class StreamManager {
    constructor() {
        this.room = null;
        this.participants = new Map();
        this.localUser = null;
        this.listeners = {
            participantJoined: [],
            participantLeft: [],
            trackSubscribed: [],
            trackUnsubscribed: [],
            messageReceived: [],
            connectionStateChanged: [],
            speakingChanged: [],
        };
    }

    async connect(apiKey, token, userId, roomId) {
        try {
            console.log('Connecting to Stream:', { apiKey, userId, roomId });

            const { StreamVideoClient, StreamCall } = window.streamVideo;

            this.client = new StreamVideoClient({
                apiKey: apiKey,
                user: { id: userId },
                token: token,
            });

            this.roomId = roomId;
            this.userId = userId;

            const call = this.client.call("default", roomId);
            this.call = call;

            await call.join({ create: true });

            this.setupCallListeners();
            this.emit('connectionStateChanged', 'connected');

            console.log('Connected to room:', roomId);
            return call;
        } catch (error) {
            console.error('Failed to connect:', error);
            this.emit('connectionStateChanged', 'disconnected');
            throw error;
        }
    }

    setupCallListeners() {
        if (!this.call) return;

        this.call.on("call.lifecycle.user_joined", (event) => {
            console.log('User joined:', event.user.id);
            this.emit('participantJoined', { identity: event.user.id });
        });

        this.call.on("call.lifecycle.user_left", (event) => {
            console.log('User left:', event.user.id);
            this.emit('participantLeft', { identity: event.user.id });
        });

        this.call.on("participant.updated", (participant) => {
            console.log('Participant updated:', participant);
        });
    }

    get localParticipant() {
        return {
            identity: this.userId,
            sid: 'local',
            isLocal: true,
        };
    }

    async publishAudio(enabled) {
        if (!this.call) return;
        await this.call.muteAudio(!enabled);
    }

    async publishVideo(enabled) {
        if (!this.call) return;
        await this.call.muteVideo(!enabled);
    }

    async startScreenShare() {
        if (!this.call) return;
        try {
            await this.call.startScreenShare();
        } catch (e) {
            console.error('Screen share error:', e);
        }
    }

    async stopScreenShare() {
        if (!this.call) return;
        try {
            await this.call.stopScreenShare();
        } catch (e) {
            console.error('Stop screen share error:', e);
        }
    }

    sendData(data) {
        if (!this.call) return;
        this.call.sendCustomEvent(data);
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
        this.emit('connectionStateChanged', 'disconnected');
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

const liveKitManager = new StreamManager();
