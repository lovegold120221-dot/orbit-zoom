# Copilot Instructions for Orbit Zoom

Meeting application powered by LiveKit with Python/FastAPI backend and vanilla JavaScript frontend.

## Project Overview

- **Backend:** Python 3.11+ with FastAPI
- **Frontend:** Vanilla JavaScript (HTML/CSS/JS)
- **Video:** LiveKit Web SDK
- **Real-time:** WebRTC via LiveKit Cloud

## Quick Start

```bash
# Backend
cd backend && source ../.venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend (static server)
python -m http.server 5000
```

## Architecture

```
orbit-zoom/
├── backend/
│   ├── main.py          # FastAPI app + token generation
│   └── config.py        # Environment config
├── frontend/
│   ├── index.html       # Landing page (Create/Join/Schedule)
│   ├── css/style.css   # Meeting UI styles
│   └── js/
│       ├── app.js           # Main meeting app
│       ├── api.js           # Backend API client
│       ├── livekit-client.js # LiveKit Room wrapper
│       └── ui-controller.js # UI state management
├── index.html           # Landing page
└── .env                # LiveKit credentials
```

## LiveKit Integration Patterns

### Token Generation (Backend)

```python
from livekit.api import AccessToken, VideoGrants
from datetime import timedelta

at = AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
at.with_identity(identity)
at.with_ttl(timedelta(hours=1))

grant = VideoGrants(
    room_join=True,
    room=room_name,
    can_publish=True,
    can_publish_data=True,
    can_subscribe=True,
)
at.with_grants(grant)
token = at.to_jwt()
```

### Room Connection (Frontend)

```javascript
const room = new LivekitClient.Room({
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: { resolution: { width: 1280, height: 720 } },
});

await room.connect(livekitUrl, token);

// Enable camera/mic
await room.localParticipant.setCameraEnabled(true);
await room.localParticipant.setMicrophoneEnabled(true);

// Listen for events
room.on(LivekitClient.RoomEvent.TrackSubscribed, handleTrack);
room.on(LivekitClient.RoomEvent.DataPacketReceived, handleData);
```

### Data Messages (Chat, Reactions)

```javascript
// Send
const data = JSON.stringify({ type: 'chat', message, sender });
await room.localParticipant.publishData(new TextEncoder().encode(data));

// Receive
room.on(LivekitClient.RoomEvent.DataPacketReceived, (payload) => {
    const { type, message } = JSON.parse(new TextDecoder().decode(payload.data));
});
```

### Screen Share

```javascript
const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio: false,
});
await room.localParticipant.publishTrack(stream.getVideoTracks()[0]);

stream.getVideoTracks()[0].onended = () => {
    // Handle screen share stopped
};
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/token` | Generate LiveKit token |
| POST | `/api/room` | Room info |
| POST | `/api/logs` | Event logging |

### Token Request

```json
POST /api/token
{
  "identity": "user-name",
  "roomName": "cosmic-summit-123",
  "canPublish": true,
  "canPublishData": true,
  "canSubscribe": true
}
```

## UI Components

### Meeting Controls

| Button | Icon | Action |
|--------|------|--------|
| Mic | `fa-microphone` | Toggle microphone |
| Camera | `fa-video` | Toggle camera |
| Screen | `fa-desktop` | Start/stop screen share |
| Chat | `fa-comment-dots` | Toggle chat sidebar |
| Hand | `fa-hand` | Raise/lower hand |
| Participants | `fa-user-group` | Show participants |
| Tile | `fa-table-cells` | Toggle tile view |
| Security | `fa-shield-halved` | Lock/waiting room |
| Info | `fa-info-circle` | Copy meeting link |
| Record | `fa-circle-dot` | Start recording |
| Caption | `fa-closed-captioning` | Live transcript |
| Translate | `fa-language` | Translation settings |
| Whiteboard | `fa-chalkboard` | Open whiteboard |
| Leave | `fa-phone-slash` | End/leave meeting |

### Popup Menus

Menus appear above buttons with backdrop blur:
```javascript
popup-menu {
    position: absolute;
    bottom: calc(100% + 15px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(25, 25, 25, 0.95);
    backdrop-filter: blur(20px);
}
```

### Sidebar Panes

- Chat (`pane-chat`) - with input
- Participants (`pane-participants`) - mute all, participant list
- Transcript (`pane-transcript`) - live captions
- Translation (`pane-translate`) - language selection

## LiveKit Components Reference

Based on [LiveKit Meet](https://github.com/lovegold120221-dot/orbit) patterns:

### Room Options

```javascript
{
    adaptiveStream: true,      // Adapt quality to bandwidth
    dynacast: true,           // Pause video when not visible
    videoCaptureDefaults: {    // Camera settings
        resolution: VideoPresets.h720,
    },
    audioCaptureDefaults: {    // Mic settings
        echoCancellation: true,
        noiseSuppression: true,
    },
    publishDefaults: {         // Publishing defaults
        simulcast: true,
        dtx: true,             // Discontinuous transmission
    },
    singlePeerConnection: true, // Optimize for P2P
}
```

### Connection Flow

1. User submits name/room → GET `/api/token`
2. Backend generates LiveKit JWT token
3. Frontend connects to LiveKit Cloud with token
4. Room creates dynamically when first participant joins

### Recording API

```typescript
// Start recording
POST /api/record/start
{ "roomName": "room-id" }

// Stop recording  
POST /api/record/stop
{ "roomName": "room-id" }
```

## Environment Variables

```env
LIVEKIT_URL=wss://project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
TOKEN_EXPIRY=3600
```

## Testing

```bash
# Test token generation
curl -X POST http://localhost:8000/api/token \
  -H "Content-Type: application/json" \
  -d '{"identity": "test", "roomName": "test-room"}'

# Test health
curl http://localhost:8000/health
```

## Common Patterns

### Participant Video Rendering

```javascript
function renderParticipant(participant) {
    const videoTrack = participant.videoTracks.values().next().value;
    if (videoTrack?.track) {
        videoTrack.track.attach(videoElement);
    }
}
```

### Handle Connection States

```javascript
room.on(RoomEvent.ConnectionStateChanged, (state) => {
    switch(state) {
        case 'connected': showConnected(); break;
        case 'connecting': showConnecting(); break;
        case 'disconnected': showDisconnected(); break;
    }
});
```

### Send Reactions

```javascript
function sendReaction(emoji) {
    room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify({
            type: 'reaction',
            emoji,
            sender: identity
        })),
        { reliable: true }
    );
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| M | Toggle mute |
| V | Toggle video |
| Space | Push to talk |
| Esc | Close menus |

## Deployment

### Backend (Production)

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend (Production)

Serve `frontend/` as static files. Configure reverse proxy:

```nginx
location / {
    root /var/www/orbit-zoom/frontend;
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://localhost:8000;
}
```
