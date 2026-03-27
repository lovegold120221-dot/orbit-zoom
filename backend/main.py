from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import logging
import uvicorn
import os
import stream as stream_sdk

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

STREAM_API_KEY = os.getenv("STREAM_API_KEY", "2xj6hhtkrgqk")
STREAM_SECRET_KEY = os.getenv(
    "STREAM_SECRET_KEY",
    "nxjjpacz74cv5sfg5x2nk7jehnt9sxsz7hr9pawxj4tp25swhmgth8veubkbaxru",
)

app = FastAPI(title="Orbit Meeting - Stream", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TokenRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=100)
    room_id: str = Field(..., min_length=1, max_length=100)


class TokenResponse(BaseModel):
    token: str
    api_key: str
    user_id: str
    room_id: str


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "orbit-meeting", "provider": "stream"}


@app.post("/api/token", response_model=TokenResponse)
async def get_token(request: TokenRequest) -> TokenResponse:
    try:
        client = stream_sdk.Stream(StreamSecret=STREAM_SECRET_KEY)
        token = client.create_token(
            user_id=request.user_id,
            exp_seconds=3600,
        )
        logger.info(f"Token generated: user={request.user_id}, room={request.room_id}")
        return TokenResponse(
            token=token,
            api_key=STREAM_API_KEY,
            user_id=request.user_id,
            room_id=request.room_id,
        )
    except Exception as e:
        logger.error(f"Token generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/room")
async def create_room(room: dict):
    return {"room_id": room.get("id", ""), "status": "created"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
