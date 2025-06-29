# Agregador de Canales Públicos de Telegram - Contexto del Proyecto

## Objetivo
Crear una aplicación web en Node.js (usando Express.js) con una interfaz sencilla en HTML/CSS/JS que sirva como agregador de canales públicos de Telegram.

## Características Funcionales

### 1. Panel Admin
Un formulario web donde el usuario pueda:
- Introducir la lista de canales públicos de Telegram a seguir (separados por coma o en una lista)
- Introducir su API Key de Telegram (para usar Telegram API o TDLib)
- Introducir su API Key de OpenAI (para enviar los mensajes a GPT-4 para análisis)

### 2. Botón de Ejecución
Al pulsar un botón, la aplicación:
- Usa la API de Telegram para leer los últimos mensajes de los últimos 20 minutos de cada canal configurado
- Agrupa todos los mensajes recogidos
- Muestra en la interfaz indicadores de progreso ("Recopilando mensajes...", "Generando resumen con OpenAI...", etc.)

### 3. Llamada a OpenAI
Envía todos los mensajes recopilados (agrupados por canal) a la API de OpenAI con un prompt que genere un informe de inteligencia que:
- **CONSOLIDE y analice toda la información de forma agregada** (no separada por canal)
- **Identifique tendencias, patrones y correlaciones** entre la información de diferentes canales
- **Priorice eventos por relevancia e impacto**
- **Genere un resumen inteligente y cohesivo** de toda la actividad de los últimos 20 minutos
- Incluya enlaces a los mensajes específicos cuando sea relevante (de canales públicos)
- Ofrezca una visión analítica consolidada, no solo un resumen literal por canal

### 4. Presentación del Informe
- El informe generado se muestra como texto plano en la misma interfaz web debajo del botón
- **El formato debe ser un análisis consolidado**, identificando:
  - Tendencias principales detectadas
  - Eventos de alto impacto con timestamps
  - Correlaciones entre información de diferentes fuentes
  - Análisis de sentimiento general
  - Recomendaciones basadas en el análisis agregado
- La aplicación queda a la espera del próximo clic para ejecutar una nueva ronda

## Consideraciones Técnicas

- Usar `node-fetch` o `axios` para llamadas HTTP
- Usar `express` para el backend web
- Guardar los canales y claves API en variables de entorno (`.env`) o en memoria temporal para la demo
- No se requiere base de datos por ahora
- No usar cron ni tareas automáticas
- Interfaz HTML/CSS simple pero funcional
- Puedes usar información mock en una primera etapa de layout

## Formato del Informe Esperado

El informe debe ser un **análisis consolidado e inteligente**, no una lista por canales. Ejemplo:

```
## ANÁLISIS CONSOLIDADO - ÚLTIMOS 20 MINUTOS

### TENDENCIAS PRINCIPALES DETECTADAS
1. **Crisis energética en Europa** - Múltiples fuentes reportan cortes de suministro
2. **Nuevo exploit de seguridad** - Afecta sistemas bancarios, confirmado por 3 canales

### EVENTOS DE ALTO IMPACTO
- **12:45** - Anuncio gubernamental sobre políticas energéticas
- **12:52** - Confirmación de vulnerabilidad crítica CVE-2024-XXXX

### CORRELACIONES IDENTIFICADAS
- La crisis energética está correlacionada con aumentos en precios de criptomonedas
- El exploit de seguridad coincide con reportes de actividad sospechosa en exchanges
```

## Notas Adicionales
- El objetivo es usar OpenAI para generar inteligencia agregada, no resúmenes por canal
- La información debe ser consolidada, priorizada y analizada de forma inteligente
- Los patrones y correlaciones entre fuentes son clave para el valor del informe