#!/usr/bin/env python3
"""
Interactive Telegram client for initial authentication and message collection.
Handles SMS verification codes and 2FA authentication for MTProto access.
"""

import asyncio
import json
import sys
import os
from datetime import datetime, timedelta
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PhoneNumberInvalidError
from telethon.tl.types import Channel, Chat, User

class InteractiveTelegramClient:
    def __init__(self, api_id: int, api_hash: str, phone: str):
        self.api_id = api_id
        self.api_hash = api_hash
        self.phone = phone
        self.session_name = f"session_{phone.replace('+', '').replace(' ', '')}"
        self.client = None
        
    async def authenticate(self):
        """Perform interactive authentication with SMS verification"""
        try:
            # Create client with session file
            self.client = TelegramClient(self.session_name, self.api_id, self.api_hash)
            
            # Connect to Telegram
            await self.client.connect()
            
            # Check if already authenticated
            if await self.client.is_user_authorized():
                print("Already authenticated!")
                return True
                
            # Send code request
            print(f"Sending verification code to {self.phone}...")
            code_request = await self.client.send_code_request(self.phone)
            
            # Prompt for verification code
            print("Please check your phone for the verification code.")
            verification_code = input("Enter the verification code: ").strip()
            
            try:
                # Sign in with the code
                await self.client.sign_in(self.phone, verification_code)
                
            except SessionPasswordNeededError:
                # 2FA is enabled, prompt for password
                print("Two-factor authentication is enabled.")
                password = input("Enter your 2FA password: ").strip()
                await self.client.sign_in(password=password)
                
            except PhoneCodeInvalidError:
                print("Invalid verification code provided.")
                return False
                
            print("Authentication successful!")
            return True
            
        except PhoneNumberInvalidError:
            print(f"Invalid phone number: {self.phone}")
            return False
        except Exception as e:
            print(f"Authentication failed: {str(e)}")
            return False
    
    async def get_recent_messages(self, channels: list, minutes_back: int = 20):
        """Get recent messages from specified channels"""
        if not self.client or not await self.client.is_user_authorized():
            print("Client not authenticated. Run authentication first.")
            return []
            
        messages = []
        time_limit = datetime.now() - timedelta(minutes=minutes_back)
        
        for channel_username in channels:
            try:
                print(f"Processing channel: {channel_username}")
                
                # Get the channel entity
                entity = await self.client.get_entity(channel_username)
                
                # Skip if not a channel
                if not isinstance(entity, Channel):
                    print(f"Warning: {channel_username} is not a channel, skipping")
                    continue
                
                # Get recent messages
                channel_messages = []
                async for message in self.client.iter_messages(entity, limit=100):
                    if message.date.replace(tzinfo=None) < time_limit:
                        break
                        
                    if message.text:
                        channel_messages.append({
                            'id': message.id,
                            'text': message.text,
                            'date': int(message.date.timestamp()),
                            'channel': channel_username,
                            'url': f"https://t.me/{channel_username.replace('@', '')}/{message.id}" if channel_username.startswith('@') else None
                        })
                
                messages.extend(channel_messages)
                print(f"Collected {len(channel_messages)} messages from {channel_username}")
                
            except Exception as e:
                print(f"Error processing channel {channel_username}: {str(e)}")
                continue
        
        print(f"Total messages collected: {len(messages)}")
        return messages
    
    async def close(self):
        """Close the client connection"""
        if self.client:
            await self.client.disconnect()

async def main():
    """Main function for interactive authentication and message collection"""
    if len(sys.argv) < 5:
        print("Usage: python telegram_client_interactive.py <api_id> <api_hash> <phone> <channels_json> [minutes_back]")
        sys.exit(1)
    
    try:
        api_id = int(sys.argv[1])
        api_hash = sys.argv[2]
        phone = sys.argv[3]
        channels = json.loads(sys.argv[4])
        minutes_back = int(sys.argv[5]) if len(sys.argv) > 5 else 20
        
        client = InteractiveTelegramClient(api_id, api_hash, phone)
        
        # Authenticate
        if not await client.authenticate():
            print("Authentication failed")
            sys.exit(1)
        
        # Get messages
        messages = await client.get_recent_messages(channels, minutes_back)
        
        # Output results as JSON
        print("TELEGRAM_MESSAGES_START")
        print(json.dumps(messages, ensure_ascii=False))
        print("TELEGRAM_MESSAGES_END")
        
        await client.close()
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())