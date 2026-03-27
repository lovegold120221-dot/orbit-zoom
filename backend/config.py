import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Settings:
    LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://localhost:7880")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")

    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

    TOKEN_EXPIRY = timedelta(seconds=int(os.getenv("TOKEN_EXPIRY", "3600")))


settings = Settings()
