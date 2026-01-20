## Objetivo del Módulo

Cerrar el ciclo completo del cliente después de la cita, mejorando:
- Asistencia y puntualidad
- Experiencia del cliente
- Calidad del servicio
- Reputación online del negocio

Este módulo convierte la operación diaria en:
**retención, mejora continua y crecimiento orgánico**.

---

## Rol del Módulo en el Sistema

Post-venta & Reputación funciona como:

- Sistema automático de recordatorios y confirmaciones
- Mecanismo de captura de feedback real
- Filtro inteligente para solicitudes de reviews públicas
- Fuente de datos cualitativos para analytics y el agente de IA

---

## Alcance por Plan

- **Basic**
  - Recordatorios simples pre-cita (email)
  - Sin feedback ni reviews

- **Pro**
  - Recordatorios automáticos
  - Feedback post-cita
  - Solicitud inteligente de reviews
  - Métricas de satisfacción

- **Enterprise**
  - Flujos configurables
  - Reportes avanzados de calidad
  - Comparativos históricos
  - Base para programas de fidelización

---

## Principios de Diseño

- Automatización sin fricción
- Comunicación clara y oportuna
- No saturar al cliente final
- Feedback primero, review después
- Reglas simples y explicables

---

## Flujos Principales

### Flujo 1 — Recordatorios Pre-cita

**Objetivo:** Reducir no-shows.

#### Ejemplo de flujo estándar
- T - 24 horas:
  - Email de recordatorio
  - Información de la cita
  - Opción de confirmar o cancelar (si aplica)

**Características:**
- Basado en estado de la cita
- Respeta zona horaria de la empresa
- Canal inicial: email
- Canales futuros: WhatsApp / SMS

---

### Flujo 2 — Confirmación de Asistencia

- El cliente puede:
  - Confirmar
  - Cancelar (según políticas)
- El estado operativo de la cita se actualiza
- Se generan eventos para:
  - CRM
  - Analytics

---

### Flujo 3 — Feedback Post-cita

**Trigger:**  
La cita es marcada como **Asistida**.

#### Contenido del feedback
- Calificación (ej. 1–5 estrellas)
- Comentario opcional

#### Reglas
- Feedback es privado
- Se asocia a:
  - Cliente
  - Servicio
  - Prestador
  - Cita

---

### Flujo 4 — Solicitud de Review Pública

**Condición:**
- Feedback positivo (ej. ≥ 4 estrellas)

**Acción:**
- Se invita al cliente a dejar una reseña pública
- Redirección a:
  - Google Maps (inicial)
  - Otros canales (futuro)

**Importante:**
- Nunca se solicita review si el feedback es negativo
- Feedback negativo queda interno para mejora

---

## Entidades Principales

### 1. Evento de Comunicación

Representa un mensaje enviado al cliente.

**Tipos:**
- Recordatorio
- Confirmación
- Feedback
- Solicitud de review

**Atributos:**
- Tipo
- Canal
- Fecha de envío
- Estado (enviado / fallido)

---

### 2. Feedback

Información cualitativa del cliente.

**Atributos:**
- Calificación
- Comentario
- Fecha
- Servicio
- Prestador
- Cliente

---

### 3. Solicitud de Review

Registro de intentos de generación de reputación.

**Atributos:**
- Canal (Google Maps)
- Fecha
- Estado (enviado / completado / ignorado)

---

## Integración con Otros Módulos

### Con Agendamiento
- Usa estados de cita como triggers
- No modifica estados financieros
- Respeta políticas de cancelación

---

### Con CRM
- Registra feedback en el perfil del cliente
- Alimenta timeline
- Permite métricas de satisfacción por cliente

---

### Con Analytics
- Tasa de asistencia
- Satisfacción promedio
- Reviews solicitadas vs realizadas
- Calidad por servicio / prestador

---

### Con Agente de IA
- Usa feedback agregado como contexto
- Detecta patrones de satisfacción / insatisfacción
- Alimenta insights semanales

---

## Reglas Importantes

- El post-venta es automático, no manual
- El cliente no recibe múltiples solicitudes seguidas
- Las comunicaciones respetan opt-outs (futuro)
- No se exponen feedbacks negativos públicamente
- Todo evento queda auditado

---

## Métricas del Módulo

- Tasa de confirmación de citas
- Tasa de asistencia
- No-shows
- Satisfacción promedio
- Reviews solicitadas
- Reviews completadas
- Impacto en reputación

---

## Consideraciones Futuras

- Encuestas personalizadas
- Fidelización y recompensas
- Follow-ups automáticos
- Reglas por servicio
- Multicanal completo (WhatsApp / SMS)

---

## Resultado Esperado

Un sistema de post-venta que:
- Reduce no-shows
- Mejora la experiencia del cliente
- Genera reputación online
- Alimenta decisiones internas
- Aumenta retención y crecimiento orgánico
