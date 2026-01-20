## Objetivo del Módulo

Proveer un **agente conversacional inteligente**, específico por empresa,
capaz de asistir a clientes finales en tiempo real, responder preguntas
sobre los servicios y **guiar la conversión hacia la cita**, usando
exclusivamente información real del negocio.

El agente también actúa como un **sensor de mercado**, analizando
conversaciones para generar insights accionables.

---

## Rol del Agente en el Sistema

El agente cumple cuatro funciones principales:

1. Atención al cliente
2. Asistencia en ventas
3. Guía hacia el agendamiento
4. Aprendizaje automático del negocio

No reemplaza la web ni el agendamiento:
**los complementa**.

---

## Alcance por Plan

- **Basic**
  - ❌ No incluye agente conversacional

- **Pro**
  - ✅ Agente activo
  - Uso limitado (tokens / conversaciones)
  - Insights básicos

- **Enterprise**
  - ✅ Agente avanzado
  - Mayor contexto y uso
  - Insights profundos y reportes automáticos

---

## Principios de Diseño

- El agente **no inventa información**
- Responde solo con datos existentes en el sistema
- Usa contexto real del negocio
- No ejecuta acciones críticas (ej. crear citas)
- Siempre redirige al flujo oficial de agendamiento

---

## Fuentes de Conocimiento del Agente

El agente se alimenta exclusivamente de:

### 1. Core de Empresa
- Brief de marketing
- Branding y tono
- Políticas del negocio
- Sedes / ubicaciones

### 2. Servicios & Recursos
- Servicios activos
- Descripciones
- Precios y duración
- Prestadores disponibles

### 3. Web & Contenido
- FAQs públicas
- Contenido visible en la página
- Mensajes de marca

### 4. CRM (Contexto del Cliente)
- Historial de citas (si existe)
- Servicios previamente tomados
- Feedback previo

---

## Capacidades del Agente

### Respuestas Informativas
- Qué servicios existen
- En qué consisten
- Cuánto cuestan
- Cuánto duran
- Dónde se prestan
- Qué políticas aplican

---

### Asistencia Comercial
- Comparar servicios
- Resolver objeciones comunes
- Aclarar dudas frecuentes
- Detectar intención de compra

---

### Conversión
- Identificar cuándo el usuario quiere agendar
- Proporcionar el **link oficial de agendamiento**
- Guiar el proceso sin ejecutarlo

> El agente **no agenda directamente**.

---

## Relación con el Cliente (CRM)

- El agente:
  - Puede identificar clientes existentes
  - Leer historial previo
  - Personalizar respuestas

Ejemplo:
> “Veo que ya tuviste una cita para este servicio anteriormente.”

---

## Registro y Trazabilidad

Cada conversación:
- Se registra en el sistema
- Se asocia a:
  - Empresa
  - Cliente (si existe)
  - Servicio (si aplica)
- Genera eventos para:
  - CRM
  - Analytics

---

## Analíticas Conversacionales

### Métricas Básicas
- Número de conversaciones
- Conversaciones por servicio
- Conversaciones que terminan en agendamiento

### Métricas Avanzadas (PRO+)
- Preguntas más frecuentes
- Objeciones más comunes
- Preguntas sin respuesta clara
- Tiempo promedio hasta conversión
- Drop-off conversacional

---

## Insights Automáticos (PRO / Enterprise)

El agente analiza periódicamente las conversaciones para detectar:

- Servicios con mayor fricción
- Información faltante en la web
- FAQs que deberían crearse
- Problemas de precio o claridad
- Oportunidades de mejora de contenido

### Frecuencia
- PRO: reportes simples (semanales)
- Enterprise: reportes avanzados y comparativos

---

## Integración con Otros Módulos

### Con Agendamiento
- Usa los mismos links de reserva
- Respeta reglas y políticas

---

### Con Analytics
- Alimenta métricas propias
- Permite correlacionar conversación ↔ conversión

---

### Con Post-venta
- Usa feedback agregado como contexto
- Detecta patrones de satisfacción / insatisfacción

---

## Reglas Importantes

- El agente no responde sin contexto válido
- Si no sabe algo, lo reconoce
- No expone información interna
- No modifica datos
- No realiza pagos
- No gestiona citas directamente

---

## Casos Borde

- Cliente pregunta por un servicio inactivo
- Cliente pide algo fuera del alcance
- Cliente quiere cancelar o modificar una cita
  → redirige al canal adecuado

---

## Métricas del Módulo

- Conversaciones totales
- Conversaciones por servicio
- Tasa de conversión a cita
- Tasa de abandono
- Preguntas sin respuesta
- Impacto del agente en reservas

---

## Consideraciones Futuras

- Agente multicanal (WhatsApp, web)
- Agente interno para staff
- Fine-tuning por industria
- Acciones sugeridas (no ejecutadas)
- Integración con fidelización

---

## Resultado Esperado

Un agente que:
- Atiende y vende sin fricción
- Usa solo información real
- Aumenta conversiones
- Aprende del mercado
- Genera inteligencia accionable
