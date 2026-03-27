/**
 * LiveKit client wrapper and room state management
 */

class LiveKitManager {
    constructor() {
        this.room = null;
        this.participants = new Map();
        this.localParticipant = null;
        this.screenShareTrack = null;
        this.listeners = {
            participantJoined: [],
            participantLeft: [],
            trackSubscribed: [],
            trackUnsubscribed: [],
            dataReceived: [],
            connectionStateChanged: [],
            speakingChanged: [],
        };
    }

    async connect(url, token, roomName) {
        try {
            console.log('Connecting to LiveKit:', { url, roomName });
            
            this.room = new window.LivekitClient.Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: { width: 1280, height: 720 },
                },
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            await this.room.connect(url, token);

            this.localParticipant = this.room.localParticipant;

            this.setupRoomListeners();
            this.setupLocalParticipantListeners();

            console.log('Connected to room:', roomName);
            this.emit('connectionStateChanged', 'connected');

            return this.room;
        } catch (error) {
            console.error('Failed to connect:', error);
            this.emit('connectionStateChanged', 'disconnected');
            throw error;
        }
    }

    setupRoomListeners() {
        this.room.on(window.LivekitClient.RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant joined:', participant.identity);
            this.participants.set(participant.sid, participant);
            this.setupParticipantListeners(participant);
            this.emit('participantJoined', participant);
        });

        this.room.on(window.LivekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
            console.log('Participant left:', participant.identity);
            this.participants.delete(participant.sid);
            this.emit('participantLeft', participant);
        });

        this.room.on(window.LivekitClient.RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('Track subscribed:', track.kind, participant.identity);
            this.emit('trackSubscribed', { track, publication, participant });
        });

        this.room.on(window.LivekitClient.RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('Track unsubscribed:', track.kind, participant.identity);
            this.emit('trackUnsubscribed', { track, publication, participant });
        });

        this.room.on(window.LivekitClient.RoomEvent.DataPacketReceived, (payload) => {
            this.emit('dataReceived', payload);
        });

        this.room.on(window.LivekitClient.RoomEvent.ConnectionStateChanged, (state) => {
            console.log('Connection state:', state);
            this.emit('connectionStateChanged', state);
        });

        this.room.on(window.LivekitClient.RoomEvent.ActiveSpeakersChanged, (speakers) => {
            this.emit('speakingChanged', speakers);
        });

        this.room.on(window.LivekitClient.RoomEvent.Disconnected, (reason) => {
            console.log('Disconnected:', reason);
            this.emit('connectionStateChanged', 'disconnected');
        });
    }

    setupLocalParticipantListeners() {
        if (!this.localParticipant) return;

        this.localParticipant.on(window.LivekitClient.ParticipantEvent.TrackMuted, (publication) => {
            console.log('Local track muted:', publication.trackName);
        });

        this.localParticipant.on(window.LivekitClient.ParticipantEvent.TrackUnmuted, (publication) => {
            console.log('Local track unmuted:', publication.trackName);
        });

        this.localParticipant.on(window.LivekitClient.ParticipantEvent.IsSpeakingChanged, (speaking) => {
            console.log('Local speaking:', speaking);
            this.emit('speakingChanged', speaking);
        });
    }

    setupParticipantListeners(participant) {
        participant.on(window.LivekitClient.ParticipantEvent.TrackMuted, (publication) => {
            console.log('Track muted:', publication.trackName);
            uiController?.renderVideoParticipant(participant);
        });

        participant.on(window.LivekitClient.ParticipantEvent.TrackUnmuted, (publication) => {
            console.log('Track unmuted:', publication.trackName);
            uiController?.renderVideoParticipant(participant);
        });

        participant.on(window.LivekitClient.ParticipantEvent.IsSpeakingChanged, (speaking) => {
            console.log('Speaking changed:', participant.identity, speaking);
        });
    }

    async toggleMicrophone(enabled) {
        try {
            await this.localParticipant.setMicrophoneEnabled(enabled);
            console.log('Microphone:', enabled ? 'enabled' : 'disabled');
            return enabled;
        } catch (error) {
            console.error('Failed to toggle microphone:', error);
            throw error;
        }
    }

    async toggleCamera(enabled) {
        try {
            await this.localParticipant.setCameraEnabled(enabled);
            console.log('Camera:', enabled ? 'enabled' : 'disabled');
            return enabled;
        } catch (error) {
            console.error('Failed to toggle camera:', error);
            throw error;
        }
    }

    isMicrophoneEnabled() {
        return this.localParticipant?.isMicrophoneEnabled || false;
    }

    isCameraEnabled() {
        return this.localParticipant?.isCameraEnabled || false;
    }

    getAllParticipants() {
        const all = [this.localParticipant, ...this.participants.values()];
        return all.filter(p => p);
    }

    async startScreenShare(constraints = { video: true, audio: false }) {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            const videoTrack = new window.LivekitClient.LocalTrackPublication(
                window.LivekitClient.Track.Kind.Video,
                new window.LivekitClient.LocalVideoTrack(stream.getVideoTracks()[0])
            );
            
            await this.localParticipant.publishTrack(stream.getVideoTracks()[0]);
            
            stream.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };
            
            this.screenShareTrack = stream.getVideoTracks()[0];
            return true;
        } catch (error) {
            console.error('Screen share failed:', error);
            throw error;
        }
    }

    async stopScreenShare() {
        if (this.screenShareTrack) {
            this.screenShareTrack.stop();
            this.screenShareTrack = null;
        }
    }

    async sendChatMessage(message) {
        if (!this.room) throw new Error('Not connected');

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({
            type: 'chat',
            message,
            sender: this.localParticipant.identity,
            timestamp: Date.now(),
        }));

        await this.localParticipant.publishData(data, { reliable: true });
    }

    async sendDataPacket(data) {
        if (!this.room) return;

        const encoder = new TextEncoder();
        const payload = encoder.encode(JSON.stringify({
            ...data,
            sender: this.localParticipant.identity,
            timestamp: Date.now(),
        }));

        await this.localParticipant.publishData(payload, { reliable: true });
    }

    async switchAudioDevice(deviceId) {
        try {
            await this.room?.switchActiveDevice('audioinput', deviceId);
        } catch (error) {
            console.error('Failed to switch audio device:', error);
        }
    }

    async switchAudioOutput(deviceId) {
        try {
            await this.room?.switchActiveDevice('audiooutput', deviceId);
        } catch (error) {
            console.error('Failed to switch audio output:', error);
        }
    }

    async switchVideoDevice(deviceId) {
        try {
            await this.room?.switchActiveDevice('videoinput', deviceId);
        } catch (error) {
            console.error('Failed to switch video device:', error);
        }
    }

    async disconnect() {
        if (this.room) {
            await this.room.disconnect();
            this.room = null;
            this.participants.clear();
            this.localParticipant = null;
            console.log('Disconnected from room');
        }
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
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }
}

const liveKitManager = new LiveKitManager();
