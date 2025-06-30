#!/usr/bin/env python3
"""
Telegram simulator for testing the complete flow without real credentials
"""
import json
import sys
import time
import random

def generate_test_messages(channels, minutes_back):
    """Generate realistic test messages for multiple channels"""
    messages = []
    current_time = int(time.time())
    start_time = current_time - (minutes_back * 60)
    
    # Sample messages for different types of channels
    crypto_messages = [
        "Bitcoin supera los $98,000 en intercambios principales",
        "Ethereum actualiza su protocolo con mejoras de eficiencia",
        "Nuevas regulaciones crypto en la UE entran en vigor",
        "DeFi TVL alcanza nuevo récord histórico de $85B",
        "Análisis técnico: BTC muestra señales alcistas a corto plazo"
    ]
    
    news_messages = [
        "Mercados globales reaccionan positivamente a datos económicos",
        "Inflación en zona euro muestra signos de moderación",
        "Tecnológicas lideran ganancias en apertura de Wall Street",
        "Banco Central anuncia nueva política monetaria expansiva",
        "Sector energético presenta volatilidad tras acuerdos OPEC"
    ]
    
    tech_messages = [
        "Nueva actualización de seguridad crítica liberada",
        "IA generativa transforma industria del software",
        "Ciberseguridad: detectado nuevo vector de ataque",
        "Cloud computing registra crecimiento del 40% anual",
        "Quantum computing alcanza hito importante en estabilidad"
    ]
    
    # Map channels to message types
    message_sets = {
        'crypto': crypto_messages,
        'bitcoin': crypto_messages,
        'ethereum': crypto_messages,
        'defi': crypto_messages,
        'news': news_messages,
        'finance': news_messages,
        'markets': news_messages,
        'tech': tech_messages,
        'security': tech_messages,
        'ai': tech_messages
    }
    
    message_id = 1
    for channel in channels:
        clean_channel = channel.replace('@', '').lower()
        
        # Select appropriate message set
        channel_messages = news_messages  # default
        for key, msgs in message_sets.items():
            if key in clean_channel:
                channel_messages = msgs
                break
        
        # Generate 2-5 messages per channel
        num_messages = random.randint(2, 5)
        for i in range(num_messages):
            message_time = random.randint(start_time, current_time)
            message_text = random.choice(channel_messages)
            
            messages.append({
                "id": message_id,
                "text": message_text,
                "date": message_time,
                "channel": clean_channel,
                "url": f"https://t.me/{clean_channel}/{message_id}"
            })
            message_id += 1
    
    # Sort by timestamp
    messages.sort(key=lambda x: x['date'])
    return messages

def main():
    """Main function to simulate telegram client"""
    if len(sys.argv) < 5:
        print(json.dumps({"error": "Usage: python telegram_simulator.py <api_id> <api_hash> <phone> <channels_json> [minutes_back]"}))
        sys.exit(1)
    
    try:
        # Parse arguments (we'll ignore credentials for simulation)
        channels_json = sys.argv[4]
        minutes_back = int(sys.argv[5]) if len(sys.argv) > 5 else 20
        
        channels = json.loads(channels_json)
        
        if not channels:
            print(json.dumps([]))  # Empty array for no channels
            return
        
        # Generate test messages
        messages = generate_test_messages(channels, minutes_back)
        
        # Output as JSON
        print(json.dumps(messages, ensure_ascii=False))
        
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid channels JSON format"}))
        sys.exit(1)
    except ValueError as e:
        print(json.dumps({"error": f"Invalid parameter: {str(e)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Simulation error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()