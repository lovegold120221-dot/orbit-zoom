import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Settings:
    _livekit_url = os.getenv("LIVEKIT_URL", "wss://localhost:7880")
    _livekit_api_key = os.getenv("LIVEKIT_API_KEY", "devkey")
    _livekit_api_secret = os.getenv("LIVEKIT_API_SECRET", "secret")

    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

    TOKEN_EXPIRY = timedelta(seconds=int(os.getenv("TOKEN_EXPIRY", "3600")))

    @property
    def LIVEKIT_URL(self):
        return self._livekit_url

    @LIVEKIT_URL.setter
    def LIVEKIT_URL(self, value):
        self._livekit_url = value

    @property
    def LIVEKIT_API_KEY(self):
        return self._livekit_api_key

    @LIVEKIT_API_KEY.setter
    def LIVEKIT_API_KEY(self, value):
        self._livekit_api_key = value

    @property
    def LIVEKIT_API_SECRET(self):
        return self._livekit_api_secret

    @LIVEKIT_API_SECRET.setter
    def LIVEKIT_API_SECRET(self, value):
        self._livekit_api_secret = value


settings = Settings()
