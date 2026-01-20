## Objetivo del Módulo

Centralizar y estructurar toda la información relacionada con los **clientes finales**
del negocio, actuando como un **CRM liviano, operativo y orientado a citas**.

El CRM no gestiona ventas genéricas, sino la **realidad del negocio de servicios**:
clientes, citas, servicios, prestadores, pagos y experiencia.

---

## Rol del CRM en el Sistema

El CRM funciona como:

- Fuente de verdad del cliente
- Memoria histórica del negocio
- Base para analíticas avanzadas
- Contexto persistente para el agente de IA
- Soporte para post-venta y fidelización futura

---

## Alcance Multi-tenant y Roles

- Todos los datos del CRM pertenecen a una **Empresa**
- No existe cruce de datos entre empresas
- Acceso controlado por rol:
  - **Owner / Admin**: acceso completo
  - **Staff**: acceso operativo
  - **Viewer**: solo lectura

---

## Principio Fundamental de Modelado

> **El CRM no conecta directamente Cliente ↔ Servicio ni Cliente ↔ Prestador.  
Toda relación pasa exclusivamente por la Cita.**

Esto permite:
- Historial real y auditable
- Métricas correctas
- Escalabilidad a escenarios complejos

---

## Entidades Principales

### 1. Cliente (Customer / Contact)

Representa a una persona que interactúa con el negocio.

**Atributos clave:**
- ID de cliente
- Empresa
- Nombre
- Email
- Teléfono
- Estado (activo / inactivo)
- Fecha de creación
- Última interacción

**Notas:**
- Un cliente puede existir sin haber agendado
- Se crea o actualiza automáticamente desde múltiples puntos
- Email / teléfono actúan como identificadores principales

---

### 2. Fuente de Adquisición

Describe cómo llegó el cliente al sistema.

**Incluye:**
- Canal (web, agente IA, campaña)
- UTMs:
  - source
  - medium
  - campaign
  - content
  - term
- Página de entrada

**Uso:**
- Analytics
- Medición de campañas
- Segmentación básica

---

### 3. Cita (Entidad Eje)

La **Cita** es el núcleo relacional del CRM.

Cada cita conecta exactamente:
- 1 Cliente
- 1 Servicio
- 1 Prestador (Recurso agendable)

Y mantiene:
- Estado operativo
- Estado financiero
- Fecha y hora
- Pagos asociados
- Feedback (si existe)

---

### 4. Prestador de Servicio (Recurso)

Puede ser:
- Profesional (persona)
- Recurso físico (cancha, sala, consultorio)

El CRM **no duplica** esta entidad:
- La referencia desde la Cita
- Permite analíticas por prestador

---

### 5. Servicio

Representa lo que el cliente contrata.

- Referenciado siempre desde la Cita
- Permite métricas de uso, conversión y satisfacción

---

### 6. Timeline del Cliente

Registro cronológico e inmutable de eventos.

**Eventos típicos:**
- Visitó un servicio
- Inició conversación con agente IA
- Reservó cita
- Pagó (parcial / total)
- Reprogramó
- Asistió / No asistió
- Dejó feedback
- Fue invitado a dejar review

**Características:**
- Solo lectura
- Ordenado por tiempo
- Fuente de contexto para IA y soporte

---

### 7. Feedback del Cliente

Información post-cita.

**Incluye:**
- Calificación (ej. 1–5)
- Comentario opcional
- Fecha
- Servicio asociado
- Prestador asociado

**Uso:**
- Métricas de satisfacción
- Reportes de calidad
- Input para IA
- Decisión de solicitud de reviews públicas

---

## Flujos Principales

### Flujo 1 — Creación / Actualización de Cliente
Un cliente se crea o actualiza cuando:
- Reserva una cita
- Inicia conversación con el agente IA
- Completa un formulario
- Deja feedback

No se generan duplicados:
- Se consolida por email / teléfono

---

### Flujo 2 — Visualización y Gestión Interna
Admin / Staff puede:
- Ver listado de clientes
- Buscar y filtrar
- Acceder al detalle del cliente
- Ver historial completo de citas
- Consultar estados operativos y financieros

---

### Flujo 3 — Uso del CRM por el Agente de IA
El agente puede:
- Leer historial del cliente
- Inferir servicios ya tomados
- Reconocer prestadores previos
- Personalizar respuestas

Ejemplo:
> “Veo que ya tuviste una cita para este servicio con este profesional.”

---

## Integración con Otros Módulos

### Con Agendamiento
- Cada cambio de estado de cita:
  - Actualiza el CRM
  - Genera eventos en el timeline
- Estados operativos y financieros visibles

---

### Con Post-venta
- Feedback se guarda en el CRM
- Se registra solicitud de review
- Se generan métricas de satisfacción

---

### Con Analytics
- Conversión por cliente
- Repetición de servicios
- No-shows por cliente
- Valor histórico del cliente
- Rendimiento por servicio y prestador

---

### Con IA
- Contexto persistente por cliente
- Análisis agregado de patrones
- Detección de objeciones frecuentes

---

## Reglas Importantes

- El CRM es obligatorio: todo pasa por él
- El historial no se borra ni se reescribe
- Las relaciones siempre pasan por la Cita
- El CRM no ejecuta campañas (por ahora)
- Un cliente ≠ usuario del SaaS

---

## Métricas del Módulo

- Clientes únicos
- Clientes recurrentes
- Clientes con no-show
- Clientes con pago anticipado
- Satisfacción promedio
- Servicios más repetidos por cliente
- Prestadores más utilizados por cliente

---

## Consideraciones Futuras

- Tags manuales por cliente
- Notas internas
- Segmentación avanzada
- Fidelización
- Exportación de datos
- Integraciones con CRMs externos

---

## Resultado Esperado

Un CRM que:
- Refleja la realidad operativa del negocio
- Escala con múltiples servicios y prestadores
- Alimenta IA y analytics con datos confiables
- No agrega complejidad innecesaria
