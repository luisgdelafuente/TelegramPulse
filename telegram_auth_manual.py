#!/usr/bin/env python3
"""
Manual Telegram authentication script
Run this to authenticate with your verification code
"""

import asyncio
import sys
import os

# Add the server directory to the path
sys.path.append('server/services')

from telegram_auth_complete import complete_authentication

async def main():
    api_id = "25392819"
    api_hash = "8032db8bcb4f2bde115c2d5fd6199832"
    phone = "+34622025321"
    
    print(f"=== Telegram Authentication ===")
    print(f"Phone: {phone}")
    print(f"A verification code should have been sent to your phone.")
    print()
    
    verification_code = input("Enter the verification code from SMS: ").strip()
    
    if not verification_code:
        print("Error: No verification code provided")
        return
    
    try:
        result = await complete_authentication(api_id, api_hash, phone, verification_code)
        if result:
            print("✅ Authentication successful!")
            print("Telegram session has been created and saved.")
        else:
            print("❌ Authentication failed.")
    except Exception as e:
        print(f"❌ Error during authentication: {e}")
        # Check if 2FA is required
        if "2FA" in str(e) or "password" in str(e):
            password = input("Enter your 2FA password: ").strip()
            try:
                result = await complete_authentication(api_id, api_hash, phone, verification_code, password)
                if result:
                    print("✅ Authentication successful with 2FA!")
                    print("Telegram session has been created and saved.")
                else:
                    print("❌ Authentication failed with 2FA.")
            except Exception as e2:
                print(f"❌ Error with 2FA: {e2}")

if __name__ == "__main__":
    asyncio.run(main())