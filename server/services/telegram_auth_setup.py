#!/usr/bin/env python3
"""
One-time authentication setup for Telegram MTProto.
Run this script manually to authenticate and create a persistent session.
"""

import asyncio
import sys
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PhoneNumberInvalidError

async def setup_authentication():
    """Interactive setup for Telegram authentication"""
    print("=== Telegram MTProto Authentication Setup ===")
    print("This is a one-time setup to authenticate your Telegram account.")
    print()
    
    # Get credentials from command line arguments
    if len(sys.argv) < 4:
        print("Usage: python telegram_auth_setup.py <api_id> <api_hash> <phone>")
        print("Example: python telegram_auth_setup.py 25392819 abc123def456 +34622025321")
        sys.exit(1)
    
    try:
        api_id = int(sys.argv[1])
        api_hash = sys.argv[2]
        phone = sys.argv[3]
        
        print(f"Setting up authentication for phone: {phone}")
        print(f"Using API ID: {api_id}")
        print()
        
        # Create session name based on phone
        session_name = f"telegram_session_{phone.replace('+', '').replace(' ', '')}"
        
        # Create client
        client = TelegramClient(session_name, api_id, api_hash)
        
        # Connect
        print("Connecting to Telegram servers...")
        await client.connect()
        
        # Check if already authenticated
        if await client.is_user_authorized():
            print("✓ Already authenticated! Session is ready to use.")
            await client.disconnect()
            return True
        
        print("Sending verification code to your phone...")
        
        # Send code request
        code_request = await client.send_code_request(phone)
        
        print(f"✓ Verification code sent to {phone}")
        print("Check your phone for the SMS with the verification code.")
        print()
        
        # Get verification code from user
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                verification_code = input("Enter the verification code: ").strip()
                
                if not verification_code:
                    print("Please enter a valid code.")
                    continue
                
                # Try to sign in
                print("Verifying code...")
                await client.sign_in(phone, verification_code)
                
                print("✓ Phone verification successful!")
                break
                
            except PhoneCodeInvalidError:
                remaining = max_attempts - attempt - 1
                if remaining > 0:
                    print(f"Invalid code. You have {remaining} attempts remaining.")
                else:
                    print("Too many invalid attempts. Please try again later.")
                    await client.disconnect()
                    return False
                    
            except SessionPasswordNeededError:
                print("Two-factor authentication (2FA) is enabled on your account.")
                print("Please enter your 2FA password:")
                
                password = input("2FA Password: ").strip()
                
                try:
                    await client.sign_in(password=password)
                    print("✓ 2FA verification successful!")
                    break
                except Exception as e:
                    print(f"2FA verification failed: {str(e)}")
                    await client.disconnect()
                    return False
        
        # Final check
        if await client.is_user_authorized():
            print()
            print("🎉 Authentication setup complete!")
            print(f"Session saved as: {session_name}.session")
            print()
            print("You can now use the main application without manual authentication.")
            print("The session will be reused automatically for future requests.")
            
            # Get user info for confirmation
            me = await client.get_me()
            print(f"Authenticated as: {me.first_name} {me.last_name or ''} (@{me.username or 'no_username'})")
            
            await client.disconnect()
            return True
        else:
            print("Authentication setup failed. Please try again.")
            await client.disconnect()
            return False
            
    except PhoneNumberInvalidError:
        print(f"Error: Invalid phone number format: {phone}")
        print("Please use international format like: +34622025321")
        return False
    except Exception as e:
        print(f"Setup failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(setup_authentication())
    sys.exit(0 if success else 1)