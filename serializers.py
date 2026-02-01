from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_email', 'recipient', 'group', 'content', 'created_at']
        read_only_fields = ['sender', 'created_at']