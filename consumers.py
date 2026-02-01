import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from apps.messaging.models import Message, IslamicMessagingGroup

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({'error': 'Invalid JSON format'}))
            return

        message_content = data.get('message')
        if not message_content:
            return
        
        message = await self.save_message(message_content)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_content,
                'sender': self.user.username,
                'timestamp': message.created_at.isoformat(),
            }
        )
    
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def save_message(self, content):
        group = IslamicMessagingGroup.objects.get(id=self.room_id)
        return Message.objects.create(
            sender=self.user, group=group, content=content
        )