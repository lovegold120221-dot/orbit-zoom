# Orbit OSS - Video Conferencing powered by LiveKit

## Quick Start

```bash
# Start the application
docker-compose up -d
```

## Manual Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
python -m http.server 5000
```

## Environment Variables

Create a `.env` file:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

## LiveKit Setup

1. Sign up at [livekit.io/cloud](https://livekit.io/cloud)
2. Create a project
3. Copy credentials to `.env`

## Features

- HD Video/Audio calls
- Screen sharing
- In-meeting chat
- Raise hand reactions
- Live captions
- Translation support
- Meeting scheduling

## Tech Stack

- Backend: Python/FastAPI
- Frontend: Vanilla JavaScript
- Video: LiveKit Web SDK
- Real-time: WebRTC

## License

MIT
