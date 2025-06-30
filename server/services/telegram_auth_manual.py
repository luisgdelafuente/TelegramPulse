#!/usr/bin/env python3
"""
Manual authentication for Telegram MTProto.
Receives verification code as command line argument.
"""

import asyncio
import sys
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError

async def authenticate_with_code(api_id, api_hash, phone, verification_code, password=None):
    """Authenticate using provided verification code"""
    
    session_name = f"telegram_session_{phone.replace('+', '').replace(' ', '')}"
    client = TelegramClient(session_name, api_id, api_hash)
    
    try:
        await client.connect()
        
        if await client.is_user_authorized():
            print("✓ Already authenticated!")
            me = await client.get_me()
            print(f"Authenticated as: {me.first_name} {me.last_name or ''}")
            await client.disconnect()
            return True
        
        # Try to sign in with the code
        try:
            await client.sign_in(phone, verification_code)
            print("✓ Phone verification successful!")
            
        except SessionPasswordNeededError:
            if not password:
                print("ERROR: 2FA is enabled but no password provided")
                print("Usage: python telegram_auth_manual.py <api_id> <api_hash> <phone> <code> [2fa_password]")
                await client.disconnect()
                return False
            
            print("Verifying 2FA password...")
            await client.sign_in(password=password)
            print("✓ 2FA verification successful!")
            
        except PhoneCodeInvalidError:
            print("ERROR: Invalid verification code")
            await client.disconnect()
            return False
        
        # Verify final authentication
        if await client.is_user_authorized():
            me = await client.get_me()
            print(f"🎉 Authentication complete!")
            print(f"Authenticated as: {me.first_name} {me.last_name or ''}")
            print(f"Session saved as: {session_name}.session")
            await client.disconnect()
            return True
        else:
            print("ERROR: Authentication failed")
            await client.disconnect()
            return False
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        if client.is_connected():
            await client.disconnect()
        return False

async def main():
    if len(sys.argv) < 5:
        print("Usage: python telegram_auth_manual.py <api_id> <api_hash> <phone> <verification_code> [2fa_password]")
        print("Example: python telegram_auth_manual.py 25392819 abc123 +34622025321 12345")
        print("With 2FA: python telegram_auth_manual.py 25392819 abc123 +34622025321 12345 mypassword")
        sys.exit(1)
    
    api_id = int(sys.argv[1])
    api_hash = sys.argv[2]
    phone = sys.argv[3]
    verification_code = sys.argv[4]
    password = sys.argv[5] if len(sys.argv) > 5 else None
    
    success = await authenticate_with_code(api_id, api_hash, phone, verification_code, password)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())