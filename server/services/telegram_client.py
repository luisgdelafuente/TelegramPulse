#!/usr/bin/env python3
"""
Telegram client using Telethon MTProto for accessing public channels.
This solves the limitation of Bot API that cannot read channel messages without admin access.
"""

import asyncio
import json
import sys
from datetime import datetime, timedelta
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError
from telethon.tl.types import Channel
import os

class TelegramChannelReader:
    def __init__(self, api_id: int, api_hash: str, phone: str):
        self.api_id = api_id
        self.api_hash = api_hash
        self.phone = phone
        self.client = TelegramClient('session', api_id, api_hash)
    
    async def authenticate(self):
        """Authenticate with Telegram using phone number"""
        await self.client.start(phone=self.phone)
        
    async def get_recent_messages(self, channels: list, minutes_back: int = 20):
        """Get recent messages from public channels"""
        all_messages = []
        cutoff_time = datetime.now() - timedelta(minutes=minutes_back)
        
        for channel_name in channels:
            try:
                # Clean channel name
                clean_name = channel_name.strip()
                if not clean_name.startswith('@'):
                    clean_name = '@' + clean_name
                
                print(f"Accessing channel: {clean_name}")
                
                # Get channel entity
                entity = await self.client.get_entity(clean_name)
                
                if not isinstance(entity, Channel):
                    print(f"Warning: {clean_name} is not a channel")
                    continue
                
                # Get recent messages
                messages = []
                async for message in self.client.iter_messages(entity, limit=100):
                    if message.date < cutoff_time:
                        break
                    
                    if message.text:
                        messages.append({
                            'id': message.id,
                            'text': message.text,
                            'date': int(message.date.timestamp()),
                            'channel': clean_name.replace('@', ''),
                            'url': f"https://t.me/{clean_name.replace('@', '')}/{message.id}"
                        })
                
                print(f"Found {len(messages)} recent messages from {clean_name}")
                all_messages.extend(messages)
                
            except Exception as e:
                print(f"Error accessing {channel_name}: {str(e)}")
                continue
        
        return all_messages
    
    async def close(self):
        """Close the client connection"""
        await self.client.disconnect()

async def main():
    """Main function to handle CLI execution"""
    if len(sys.argv) < 5:
        print("Usage: python telegram_client.py <api_id> <api_hash> <phone> <channels_json> [minutes_back]")
        sys.exit(1)
    
    api_id = int(sys.argv[1])
    api_hash = sys.argv[2]
    phone = sys.argv[3]
    channels_json = sys.argv[4]
    minutes_back = int(sys.argv[5]) if len(sys.argv) > 5 else 20
    
    try:
        channels = json.loads(channels_json)
        
        client = TelegramChannelReader(api_id, api_hash, phone)
        await client.authenticate()
        
        messages = await client.get_recent_messages(channels, minutes_back)
        
        # Output results as JSON
        print(json.dumps(messages, ensure_ascii=False))
        
        await client.close()
        
    except Exception as e:
        error_msg = str(e)
        if "api_id/api_hash combination is invalid" in error_msg:
            print(json.dumps({"error": "Invalid Telegram credentials. Check your API ID and Hash from my.telegram.org"}))
        elif "phone number" in error_msg.lower():
            print(json.dumps({"error": "Invalid phone number format. Use international format: +1234567890"}))
        elif "network" in error_msg.lower() or "connection" in error_msg.lower():
            print(json.dumps({"error": "Network connection failed. Check your internet connection"}))
        else:
            print(json.dumps({"error": f"Telegram error: {error_msg}"}))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())