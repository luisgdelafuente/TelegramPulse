#!/usr/bin/env python3
"""
Simplified Telegram client using Telethon with proper session management.
Handles authentication state properly and provides clear error messages.
"""

import asyncio
import json
import sys
import os
from datetime import datetime, timedelta
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PhoneNumberInvalidError
from telethon.tl.types import Channel

async def get_messages_with_session(api_id, api_hash, phone, channels, minutes_back):
    """Get messages using existing session or provide clear instructions for setup"""
    
    # Create session name based on phone
    session_name = f"telegram_session_{phone.replace('+', '').replace(' ', '')}"
    session_file = f"{session_name}.session"
    
    # Check if session file exists
    if not os.path.exists(session_file):
        print("ERROR: No authenticated session found")
        print("SETUP_REQUIRED: Please run the authentication setup first")
        print(f"Command: python3 server/services/telegram_auth_setup.py {api_id} {api_hash} {phone}")
        return []
    
    client = TelegramClient(session_name, api_id, api_hash)
    
    try:
        await client.connect()
        
        if not await client.is_user_authorized():
            print("ERROR: Session expired or invalid")
            print("SETUP_REQUIRED: Please re-run authentication setup")
            print(f"Command: python3 server/services/telegram_auth_setup.py {api_id} {api_hash} {phone}")
            return []
        
        # Get user info
        me = await client.get_me()
        print(f"Authenticated as: {me.first_name} {me.last_name or ''}")
        
        # Collect messages
        all_messages = []
        cutoff_time = datetime.now() - timedelta(minutes=minutes_back)
        
        for channel_name in channels:
            try:
                # Clean channel name
                clean_name = channel_name.strip()
                if not clean_name.startswith('@'):
                    clean_name = '@' + clean_name
                
                print(f"Processing channel: {clean_name}")
                
                # Get channel entity
                entity = await client.get_entity(clean_name)
                
                if not isinstance(entity, Channel):
                    print(f"Warning: {clean_name} is not a public channel")
                    continue
                
                # Collect recent messages
                message_count = 0
                async for message in client.iter_messages(entity, limit=100):
                    if message.date.replace(tzinfo=None) < cutoff_time:
                        break
                    
                    if message.text:
                        all_messages.append({
                            'id': message.id,
                            'text': message.text,
                            'date': int(message.date.timestamp()),
                            'channel': clean_name,
                            'url': f"https://t.me/{clean_name.replace('@', '')}/{message.id}"
                        })
                        message_count += 1
                
                print(f"Collected {message_count} messages from {clean_name}")
                
            except Exception as e:
                print(f"Error with channel {channel_name}: {str(e)}")
                continue
        
        print(f"Total messages collected: {len(all_messages)}")
        return all_messages
        
    except Exception as e:
        print(f"Connection error: {str(e)}")
        return []
    finally:
        if client.is_connected():
            await client.disconnect()

async def main():
    """Main function for message collection"""
    if len(sys.argv) < 5:
        print("Usage: python telegram_simple.py <api_id> <api_hash> <phone> <channels_json> [minutes_back]")
        sys.exit(1)
    
    try:
        api_id = int(sys.argv[1])
        api_hash = sys.argv[2]
        phone = sys.argv[3]
        channels = json.loads(sys.argv[4])
        minutes_back = int(sys.argv[5]) if len(sys.argv) > 5 else 20
        
        messages = await get_messages_with_session(api_id, api_hash, phone, channels, minutes_back)
        
        # Output messages in expected format
        print("TELEGRAM_MESSAGES_START")
        print(json.dumps(messages, ensure_ascii=False))
        print("TELEGRAM_MESSAGES_END")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())