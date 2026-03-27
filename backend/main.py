from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional
import logging
import uvicorn
import os

from livekit.api import AccessToken, VideoGrants
from config import settings

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Orbit Meeting - LiveKit",
    description="Meeting interface powered by LiveKit",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TokenRequest(BaseModel):
    identity: str = Field(..., min_length=1, max_length=100)
    roomName: str = Field(..., min_length=1, max_length=100)
    metadata: Optional[str] = None
    canPublish: bool = True
    canPublishData: bool = True
    canSubscribe: bool = True


class TokenResponse(BaseModel):
    token: str
    url: str
    identity: str
    roomName: str


class RoomInfo(BaseModel):
    name: str
    maxParticipants: Optional[int] = None


PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "orbit-livekit",
        "livekit_url": settings.LIVEKIT_URL,
    }


@app.post("/api/token", response_model=TokenResponse)
async def get_token(request: TokenRequest) -> TokenResponse:
    try:
        if not request.identity or not request.roomName:
            raise HTTPException(
                status_code=400, detail="identity and roomName are required"
            )

        at = AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        at.with_identity(request.identity)
        at.with_ttl(settings.TOKEN_EXPIRY)

        grant = VideoGrants(
            room_join=True,
            room=request.roomName,
            can_publish=request.canPublish,
            can_publish_data=request.canPublishData,
            can_subscribe=request.canSubscribe,
        )
        at.with_grants(grant)

        token = at.to_jwt()

        logger.info(
            f"Token generated: identity={request.identity}, room={request.roomName}"
        )

        return TokenResponse(
            token=token,
            url=settings.LIVEKIT_URL,
            identity=request.identity,
            roomName=request.roomName,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token generation error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate token: {str(e)}"
        )


@app.post("/api/room")
async def create_room(room: RoomInfo):
    try:
        logger.info(f"Room requested: {room.name}")
        return {
            "name": room.name,
            "status": "ready",
            "url": settings.LIVEKIT_URL,
            "message": "Room will be created when first participant joins",
        }
    except Exception as e:
        logger.error(f"Room creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/logs")
async def log_event(event: dict):
    logger.info(f"Frontend event: {event}")
    return {"status": "logged"}


@app.get("/api/debug")
async def debug_info():
    return {
        "livekit_url": settings.LIVEKIT_URL,
        "api_key_set": bool(settings.LIVEKIT_API_KEY),
        "api_secret_set": bool(settings.LIVEKIT_API_SECRET),
    }


@app.get("/")
async def root():
    index_path = os.path.join(PROJECT_ROOT, "index.html")
    return FileResponse(index_path)


@app.get("/meeting")
async def meeting_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/css/{filename}")
async def serve_css(filename: str):
    return FileResponse(os.path.join(FRONTEND_DIR, "css", filename))


@app.get("/js/{filename}")
async def serve_js(filename: str):
    return FileResponse(os.path.join(FRONTEND_DIR, "js", filename))


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("health"):
        raise HTTPException(status_code=404, detail="Not Found")

    file_path = os.path.join(FRONTEND_DIR, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    index_path = os.path.join(PROJECT_ROOT, "index.html")
    return FileResponse(index_path)


CADDYFILE_PATH = "/root/Caddyfile"


@app.post("/api/config/caddy")
async def update_caddyfile(content: dict):
    try:
        caddyfile_content = content.get("caddyfile", "")
        with open(CADDYFILE_PATH, "w") as f:
            f.write(caddyfile_content)
        logger.info("Caddyfile updated successfully")
        return {"status": "ok", "message": "Caddyfile updated"}
    except Exception as e:
        logger.error(f"Caddyfile update error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/config/reload-caddy")
async def reload_caddy():
    import subprocess

    try:
        result = subprocess.run(
            ["caddy", "reload", "--config", CADDYFILE_PATH],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            return {"status": "ok", "message": "Caddy reloaded"}
        else:
            return {"status": "error", "message": result.stderr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host=settings.HOST, port=settings.PORT, log_level="info")
