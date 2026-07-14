from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

def send_live_notification(user, title, message):
    # 1. Save Notification in the Database
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message
    )
    
    # 2. Broadcast via WebSocket if Channel Layer is configured
    channel_layer = get_channel_layer()
    if channel_layer:
        group_name = f"user_{user.id}"
        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "send_notification",
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "created_at": notification.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    "is_read": notification.is_read
                }
            )
        except Exception as e:
            print(f"Failed to broadcast live notification: {e}")
            
    return notification
