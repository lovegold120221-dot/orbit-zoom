import json
import os

LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "wss://veppcall-4ncbuy3i.livekit.cloud")
LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "APIJ8bG4kQ9LQpA")
LIVEKIT_API_SECRET = os.environ.get(
    "LIVEKIT_API_SECRET", "qf8vuIQSHDgEh7fjkqYKvWnqo2oiX70lzdutSGxYRN4"
)
TOKEN_EXPIRY = 3600


def handler(request, context):
    from livekit.api import AccessToken, VideoGrants

    if request.method == "GET":
        return {
            "statusCode": 200,
            "body": json.dumps(
                {"status": "ok", "service": "orbit-meeting", "livekit_url": LIVEKIT_URL}
            ),
        }

    body = json.loads(request.body)
    identity = body.get("identity", "")
    room_name = body.get("roomName", "")

    at = AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    at.with_identity(identity)
    at.with_ttl(TOKEN_EXPIRY)

    grant = VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=body.get("canPublish", True),
        can_publish_data=body.get("canPublishData", True),
        can_subscribe=body.get("canSubscribe", True),
    )
    at.with_grants(grant)

    token = at.to_jwt()

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "token": token,
                "url": LIVEKIT_URL,
                "identity": identity,
                "roomName": room_name,
            }
        ),
    }
