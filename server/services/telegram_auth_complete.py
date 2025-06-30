#!/usr/bin/env python3
"""
Complete Telegram authentication in one go.
Handles the full flow from code request to verification.
"""

import asyncio
import sys
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError

async def complete_authentication(api_id, api_hash, phone, verification_code, password=None):
    """Complete authentication flow with verification code"""
    
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
        
        # Send code request first
        print(f"Sending verification code to {phone}...")
        code_request = await client.send_code_request(phone)
        print(f"✓ Code sent, now verifying with: {verification_code}")
        
        # Sign in with the provided code
        try:
            await client.sign_in(phone, verification_code)
            print("✓ Phone verification successful!")
            
        except SessionPasswordNeededError:
            if not password:
                print("ERROR: 2FA is enabled. Please provide your 2FA password:")
                print("Usage: python telegram_auth_complete.py <api_id> <api_hash> <phone> <code> [2fa_password]")
                await client.disconnect()
                return False
            
            print("Verifying 2FA password...")
            await client.sign_in(password=password)
            print("✓ 2FA verification successful!")
            
        except PhoneCodeInvalidError:
            print("ERROR: Invalid verification code. The code may have expired.")
            print("Please request a new code and try again.")
            await client.disconnect()
            return False
        
        # Verify final authentication
        if await client.is_user_authorized():
            me = await client.get_me()
            print(f"🎉 Authentication complete!")
            print(f"Authenticated as: {me.first_name} {me.last_name or ''}")
            print(f"Session saved as: {session_name}.session")
            print("")
            print("You can now use the application normally!")
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
        print("Usage: python telegram_auth_complete.py <api_id> <api_hash> <phone> <verification_code> [2fa_password]")
        print("Example: python telegram_auth_complete.py 25392819 abc123 +34622025321 73708")
        print("With 2FA: python telegram_auth_complete.py 25392819 abc123 +34622025321 73708 mypassword")
        sys.exit(1)
    
    api_id = int(sys.argv[1])
    api_hash = sys.argv[2]
    phone = sys.argv[3]
    verification_code = sys.argv[4]
    password = sys.argv[5] if len(sys.argv) > 5 else None
    
    print("=== Telegram MTProto Authentication ===")
    print(f"Phone: {phone}")
    print(f"API ID: {api_id}")
    print("")
    
    success = await complete_authentication(api_id, api_hash, phone, verification_code, password)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())