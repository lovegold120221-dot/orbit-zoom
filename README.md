# Orbit Meeting

Real-time video conferencing powered by **LiveKit** and **FastAPI**. Built with Orbit by Eburon AI.

## Features

- Real-time video/audio communication (WebRTC)
- Screen sharing with multiple source options
- In-meeting chat with message history
- Raise hand / Reactions
- Live captions/transcript
- Live translation support
- Participant management
- Device selection (camera, microphone, speaker)
- Meeting security controls
- Cloud/local recording
- Whiteboard integration
- Modern, responsive UI with animated backgrounds
- Tile/Speaker view layouts

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI
- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Video:** LiveKit Web SDK
- **Real-time:** WebRTC via LiveKit Cloud

## Quick Start

### Prerequisites

- Python 3.11+
- LiveKit Cloud account (free tier available)

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your LiveKit credentials
nano .env
```

### 3. Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Start the Frontend

```bash
# In another terminal from project root
python -m http.server 5000
```

### 5. Open in Browser

Navigate to `http://localhost:5000`

## Project Structure

```
orbit-zoom/
├── backend/
│   ├── main.py          # FastAPI application
│   └── config.py        # Configuration
├── frontend/
│   ├── index.html       # Meeting interface
│   ├── css/
│   │   └── style.css    # Styling
│   └── js/
│       ├── app.js           # Main application
│       ├── api.js           # API client
│       ├── livekit-client.js # LiveKit wrapper
│       └── ui-controller.js # UI management
├── index.html           # Landing page
├── requirements.txt    # Python dependencies
├── .env                # Environment variables
├── .env.example        # Environment template
├── docker-compose.yml  # Docker setup
├── nginx.conf          # Nginx config
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Health check |
| `POST /api/token` | POST | Generate LiveKit token |
| `POST /api/room` | POST | Create room info |
| `POST /api/logs` | POST | Log events |

### Token Generation Example

```bash
curl -X POST http://localhost:8000/api/token \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "user1",
    "roomName": "test-room"
  }'
```

## Docker Deployment

```bash
# Start all services
docker-compose up

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

## Meeting Controls

| Button | Description |
|--------|-------------|
| 🎤 | Toggle microphone (red = muted) |
| 📹 | Toggle camera (red = off) |
| 🖥️ | Share screen (entire screen, window, or browser tab) |
| 💬 | Open chat panel |
| 👋 | Reactions / Raise hand |
| 👥 | View participants |
| 📐 | Toggle tile/speaker view |
| 🔒 | Security options (lock meeting, waiting room) |
| ℹ️ | Meeting info & link sharing |
| ⏺️ | Start recording |
| 📝 | Live captions/transcript |
| 🌐 | Translation settings |
| 📋 | Whiteboard |
| 📴 | Leave meeting |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `M` | Toggle mute |
| `V` | Toggle video |
| `Space` | Push to talk |
| `Esc` | Close menus/sidebar |

## Deployment

### Backend (Production)

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend (Production)

Serve `frontend/` directory with any static file server (nginx, Caddy, etc.):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/orbit-zoom/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## LiveKit Cloud Setup

1. Sign up at [livekit.io/cloud](https://livekit.io/cloud)
2. Create a new project
3. Copy the WebSocket URL, API Key, and API Secret
4. Paste into your `.env` file

## License

MIT License - Built with Orbit by Eburon AI
