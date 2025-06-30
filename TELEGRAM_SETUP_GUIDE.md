# Guía de Configuración - Telegram Intelligence Aggregator

## Configuración Inicial (Solo una vez)

### 1. Obtener Credenciales de Telegram

1. Ve a **https://my.telegram.org**
2. Inicia sesión con tu número de teléfono
3. Ve a "API Development Tools"
4. Crea una nueva aplicación si no tienes una
5. Anota los siguientes datos:
   - **API ID** (número de 7-8 dígitos)
   - **API Hash** (cadena de 32 caracteres alfanuméricos)

### 2. Configurar la Aplicación

1. Abre la aplicación web
2. Ve al **Panel de Administración**
3. Introduce:
   - **API ID** de Telegram
   - **API Hash** de Telegram  
   - **Número de teléfono** (formato internacional: +34622025321)
   - **API Key de OpenAI**
   - **Canales a monitorear** (ej: @bitcoin, @ethereum, @criptonomicon)
4. Guarda la configuración

### 3. Autenticación MTProto (Solo primera vez)

La primera vez que uses el sistema, necesitas autenticar tu cuenta de Telegram:

```bash
# Ejecuta este comando en la terminal
./setup_telegram_auth.sh
```

El script te guiará a través del proceso:
1. Te enviará un código por SMS a tu teléfono
2. Introduce el código cuando se te pida
3. Si tienes 2FA activado, introduce tu contraseña
4. Se guardará una sesión permanente

### 4. Usar la Aplicación

Una vez completada la autenticación inicial:
1. Ve al **Panel de Ejecución**
2. Presiona **"Iniciar Análisis"**
3. El sistema:
   - Recopilará mensajes de los últimos 20 minutos
   - Los enviará a OpenAI para análisis
   - Generará un informe de inteligencia consolidado

## Resolución de Problemas

### Error: "AUTHENTICATION_REQUIRED"
- Ejecuta `./setup_telegram_auth.sh` para autenticarte
- Verifica que tus credenciales sean correctas

### Error: "Invalid phone number"
- Usa formato internacional: +34622025321
- Incluye el código de país con el símbolo +

### Error: "Session expired"  
- Vuelve a ejecutar `./setup_telegram_auth.sh`
- Tu sesión puede haber expirado después de mucho tiempo sin uso

### Error: "Channel not found"
- Verifica que el canal sea público
- Usa el formato correcto: @nombrecanal
- Algunos canales pueden tener acceso restringido

## Características del Sistema

### Recolección de Datos
- Mensajes de los últimos 20 minutos por defecto
- Acceso a canales públicos sin necesidad de ser administrador
- Manejo automático de múltiples canales

### Análisis de IA
- Análisis consolidado usando OpenAI GPT-4o
- Identificación de tendencias y correlaciones
- Análisis de sentimiento
- Eventos de alto impacto
- Recomendaciones basadas en patrones

### Informes Generados
- Resumen ejecutivo
- Tendencias principales
- Eventos destacados
- Análisis de correlaciones
- Recomendaciones estratégicas

## Seguridad

- Las credenciales se almacenan de forma segura
- Las sesiones de Telegram se guardan localmente
- No se comparten datos con terceros
- API Keys protegidas en el servidor

## Soporte

Si tienes problemas con la configuración:
1. Verifica que tus credenciales sean correctas en my.telegram.org
2. Asegúrate de tener conexión a internet estable
3. Confirma que los canales que quieres monitorear sean públicos
4. Revisa los logs del servidor para errores específicos