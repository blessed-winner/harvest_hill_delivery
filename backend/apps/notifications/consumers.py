import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract JWT from query string
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = dict(x.split('=') for x in query_string.split('&') if '=' in x)
        token_str = params.get('token', None)

        if not token_str:
            await self.close()
            return

        self.user = await self.get_user_from_token(token_str)
        if not self.user:
            await self.close()
            return

        self.group_name = f"user_{self.user.id}"

        # Join user group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    @database_sync_to_async
    def get_user_from_token(self, token_str):
        try:
            token = AccessToken(token_str)
            user_id = token['user_id']
            return User.objects.get(id=user_id)
        except Exception:
            return None

    # Receive message from user group
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "id": event["id"],
            "title": event["title"],
            "message": event["message"],
            "created_at": event["created_at"],
            "is_read": event["is_read"],
        }))
