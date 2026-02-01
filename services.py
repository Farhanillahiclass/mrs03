import requests
import logging
import phonenumbers
from django.conf import settings

logger = logging.getLogger(__name__)

class WhatsAppService:
    """
    WhatsApp Integration Service
    Integrates with WhatsApp Business API
    """
    
    def __init__(self):
        self.api_url = settings.WHATSAPP_API_URL
        self.api_token = settings.WHATSAPP_API_TOKEN
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.business_account_id = settings.WHATSAPP_BUSINESS_ACCOUNT_ID
        
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json',
        }
    
    def create_group(self, group_name, participants):
        """
        Create WhatsApp group with participants
        """
        try:
            # Phone numbers must be in E.164 format
            participant_list = [
                self._format_phone_number(user.profile.whatsapp_number)
                for user in participants
                if user.profile.whatsapp_number
            ]
            
            if not participant_list:
                logger.warning("No valid WhatsApp numbers for group creation")
                return None
            
            payload = {
                "messaging_product": "whatsapp",
                "operation": "create",
                "name": group_name,
                "participants": participant_list,
            }
            
            response = requests.post(
                f"{self.api_url}/message_groups",
                json=payload,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                group_data = response.json()
                group_id = group_data.get('id')
                group_link = self._get_group_invite_link(group_id)
                
                logger.info(f"WhatsApp group created: {group_id}")
                return {
                    'group_id': group_id,
                    'group_link': group_link,
                    'status': 'success'
                }
            else:
                logger.error(f"Failed to create WhatsApp group: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"WhatsApp group creation error: {str(e)}")
            return None

    def send_message_to_user(self, user, message_text, message_type='text'):
        """
        Send personal message to user via WhatsApp
        """
        try:
            if not hasattr(user, 'profile') or not user.profile.whatsapp_number:
                logger.warning(f"User {user.username} has no WhatsApp number")
                return False
            
            phone_number = self._format_phone_number(user.profile.whatsapp_number)
            
            if not phone_number:
                logger.warning(f"Invalid WhatsApp number for user {user.username}")
                return False
            
            payload = {
                "messaging_product": "whatsapp",
                "to": phone_number,
                "type": "text",
                "text": {
                    "preview_url": True,
                    "body": message_text
                }
            }
            
            response = requests.post(
                f"{self.api_url}/{self.phone_number_id}/messages",
                json=payload,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Message sent to {user.username} via WhatsApp")
                return True
            else:
                logger.error(f"Failed to send personal message: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"WhatsApp personal message error: {str(e)}")
            return False

    def _format_phone_number(self, phone_number):
        """
        Format phone number to E.164 format using phonenumbers library.
        Defaults to Pakistan (PK) if no country code is provided.
        """
        try:
            parsed_number = phonenumbers.parse(phone_number, "PK")
            
            if phonenumbers.is_valid_number(parsed_number):
                return phonenumbers.format_number(
                    parsed_number, 
                    phonenumbers.PhoneNumberFormat.E164
                )
        except phonenumbers.NumberParseException:
            logger.error(f"Invalid phone number format: {phone_number}")
        
        return None
    
    def _get_group_invite_link(self, group_id):
        """
        Get WhatsApp group invite link
        """
        try:
            response = requests.get(
                f"{self.api_url}/message_groups/{group_id}/invite_link",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json().get('invite_link')
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting group invite link: {str(e)}")
            return None

    def add_member_to_group(self, group_id, user):
        """
        Add member to existing WhatsApp group
        """
        try:
            if not user.profile.whatsapp_number:
                logger.warning(f"User {user.username} has no WhatsApp number")
                return False
            
            phone_number = self._format_phone_number(user.profile.whatsapp_number)
            
            payload = {
                "messaging_product": "whatsapp",
                "operation": "update",
                "group_id": group_id,
                "add_participant": [phone_number],
            }
            
            response = requests.post(
                f"{self.api_url}/message_groups/{group_id}",
                json=payload,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"User {user.username} added to WhatsApp group {group_id}")
                return True
            else:
                logger.error(f"Failed to add user to group: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"WhatsApp add member error: {str(e)}")
            return False