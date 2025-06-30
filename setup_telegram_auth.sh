#!/bin/bash
# Script para configurar la autenticación de Telegram MTProto
# Este script debe ejecutarse una sola vez para autenticar tu cuenta

echo "=== Configuración de Autenticación Telegram MTProto ==="
echo ""
echo "Este script te ayudará a autenticar tu cuenta de Telegram para acceder a canales públicos."
echo "Solo necesitas hacer esto una vez. Después, el sistema usará la sesión guardada automáticamente."
echo ""

# Leer credenciales de la configuración actual
API_ID=$(curl -s http://localhost:5000/api/configuration | jq -r '.telegramApiId // empty')
API_HASH=$(curl -s http://localhost:5000/api/configuration | jq -r '.telegramApiHash // empty')
PHONE=$(curl -s http://localhost:5000/api/configuration | jq -r '.telegramPhone // empty')

if [ -z "$API_ID" ] || [ -z "$API_HASH" ] || [ -z "$PHONE" ]; then
    echo "❌ No se encontraron credenciales en la configuración."
    echo "Por favor, configura primero tus credenciales en el panel de administración:"
    echo "  - API ID (de my.telegram.org)"
    echo "  - API Hash (de my.telegram.org)"
    echo "  - Número de teléfono (formato: +34622025321)"
    echo ""
    exit 1
fi

echo "Usando credenciales de la configuración:"
echo "  API ID: $API_ID"
echo "  Teléfono: $PHONE"
echo ""

echo "🔄 Iniciando proceso de autenticación..."
echo "Telegram te enviará un código de verificación por SMS."
echo ""

# Ejecutar el script de autenticación
python3 server/services/telegram_auth_setup.py "$API_ID" "$API_HASH" "$PHONE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Autenticación completada exitosamente!"
    echo ""
    echo "Ahora puedes usar la aplicación normalmente. El sistema utilizará"
    echo "automáticamente la sesión guardada para acceder a los canales."
    echo ""
    echo "Para probar el sistema, ve a la aplicación web y ejecuta un análisis."
else
    echo ""
    echo "❌ La autenticación falló."
    echo ""
    echo "Posibles soluciones:"
    echo "1. Verifica que las credenciales sean correctas en my.telegram.org"
    echo "2. Asegúrate de que el número de teléfono esté en formato internacional (+34...)"
    echo "3. Verifica que tengas conexión a internet"
    echo "4. Si tienes 2FA activado, asegúrate de tener la contraseña lista"
    echo ""
fi