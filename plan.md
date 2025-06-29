# Plan de Desarrollo - Agregador de Canales de Telegram

## Criterios de Éxito del MVP

### Styling
- Interfaz HTML/CSS simple pero funcional
- Diseño limpio y profesional
- Indicadores de progreso visuales
- Layout responsive básico
- Formularios bien organizados

### Funcionalidad
- Panel de administración con formularios para:
  - Lista de canales públicos de Telegram
  - API Key de Telegram
  - API Key de OpenAI
- Botón de ejecución que desencadena el proceso completo
- Recopilación de mensajes de los últimos 20 minutos por canal
- Integración con API de Telegram para lectura de mensajes
- Envío de mensajes agrupados a OpenAI para análisis **consolidado**
- **Generación de informe de inteligencia agregado** que:
  - Consolide información de todos los canales
  - Identifique tendencias y patrones cross-canal
  - Priorice eventos por relevancia e impacto
  - Genere análisis cohesivo y inteligente
- Visualización del informe consolidado en la interfaz web

### Detalles Técnicos
- Usar Express.js para el backend
- Manejo de variables de entorno para APIs
- Indicadores de progreso en tiempo real
- Manejo de errores para APIs externas
- Sin base de datos (datos en memoria)
- Sin tareas automáticas (solo ejecución manual)
- **Prompt de OpenAI optimizado para análisis agregado**

## Prompt de OpenAI para Análisis Consolidado

```
Eres un analista de inteligencia especializado en agregar información de múltiples fuentes.

DATOS: [Todos los mensajes de los últimos 20 minutos de múltiples canales de Telegram]

TAREA: Genera un informe de inteligencia consolidado que:

1. AGREGAR: Combina toda la información sin separarla por canal
2. CORRELACIONAR: Identifica patrones y conexiones entre diferentes fuentes
3. PRIORIZAR: Destaca eventos de mayor relevancia e impacto
4. ANALIZAR: Proporciona insights inteligentes, no solo resúmenes
5. ESTRUCTURAR: Organiza en secciones lógicas y cohesivas

FORMATO REQUERIDO:
- Tendencias principales detectadas
- Eventos de alto impacto con timestamps
- Correlaciones entre fuentes
- Análisis de sentimiento general
- Recomendaciones basadas en patrones identificados
```

## Formato de Informe Objetivo

### INCORRECTO (por canal):
```
## CANALES ANALIZADOS
- @tecnologia: 15 mensajes
- @noticias: 12 mensajes

### Tecnología
- Tema A
### Noticias  
- Tema B
```

### CORRECTO (consolidado):
```
## ANÁLISIS CONSOLIDADO - ÚLTIMOS 20 MINUTOS

### TENDENCIAS PRINCIPALES
1. **Crisis energética en Europa** - Confirmado por múltiples fuentes
2. **Exploit de seguridad crítico** - Impacto en sector financiero

### EVENTOS DE ALTO IMPACTO
- **12:45** - Anuncio gubernamental (3 canales)
- **12:52** - Confirmación vulnerabilidad CVE-2024-XXXX

### CORRELACIONES IDENTIFICADAS
- Crisis energética correlacionada con aumento crypto
- Exploit coincide con actividad sospechosa en exchanges
```

## Fases de Desarrollo

### Fase 1: Estructura Básica y Interfaz ✅
- Configuración del proyecto Node.js/Express
- Interfaz HTML básica con formularios
- Estructura de archivos y rutas básicas

### Fase 2: Integración con APIs ✅
- Implementación de Telegram API
- **Implementación de OpenAI API con prompt de análisis consolidado**
- Manejo de errores y respuestas

### Fase 3: Funcionalidad Completa ⚠️ EN PROGRESO
- Flujo completo de recopilación y análisis
- **Generación de informes consolidados reales**
- Indicadores de progreso
- Presentación de informes

### Fase 4: Optimización y Mejoras
- **Optimización del prompt de OpenAI para mejor consolidación**
- Manejo de errores mejorado
- Optimización de rendimiento
- Mejoras en la interfaz de usuario