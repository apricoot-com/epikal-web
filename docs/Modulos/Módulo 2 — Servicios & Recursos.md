## Objetivo del Módulo

Modelar **qué se vende** (servicios) y **quién o qué lo presta** (recursos),
permitiendo múltiples configuraciones de agenda según el tipo de negocio
(profesionales, canchas, salas, consultorios, etc.).

Este módulo es la base del **agendamiento**, del **agente de IA** y de gran parte
de las **analíticas** del sistema.

---

## Responsabilidades

- Definir y gestionar servicios ofrecidos por la empresa
- Definir recursos agendables (personas o recursos físicos)
- Establecer la relación servicio ↔ recurso
- Definir reglas de duración, precio y anticipo
- Asociar calendarios externos (Google Calendar)
- Exponer información estructurada a:
  - Agendamiento
  - Agente IA
  - Web pública
  - CRM y Analytics

---

## Alcance Multi-tenant y Roles

- Todos los servicios y recursos pertenecen a **una Empresa**
- Acceso controlado por rol:
  - Owner / Admin: CRUD completo
  - Staff: gestión operativa (según permisos)
  - Viewer: solo lectura

---

## Entidades Principales

### 1. Servicio

Representa **lo que el cliente compra**.

**Atributos clave:**
- ID de servicio
- Empresa
- Nombre
- Descripción larga
- Duración (en minutos)
- Precio base
- Permite pago anticipado (sí/no)
- Monto de anticipo (si aplica)
- Estado (activo / inactivo)
- Orden / prioridad
- Visible en web (sí/no)

**Contenido asociado:**
- Imágenes
- Video (opcional)
- FAQs específicas del servicio
- Información extendida (solo para agente IA)

---

### 2. Recurso Agendable

Representa **quién o qué presta el servicio**.

Puede ser:
- Profesional (persona)
- Recurso físico (cancha, sala, consultorio)
- Recurso genérico (único calendario)

**Atributos clave:**
- ID de recurso
- Empresa
- Tipo de recurso:
  - Profesional
  - Recurso físico
- Nombre visible
- Descripción (opcional)
- Sede asociada
- Estado (activo / inactivo)

---

### 3. Calendario del Recurso

Define **la disponibilidad real** del recurso.

**Atributos:**
- Recurso
- Tipo de calendario:
  - Google Calendar
  - (futuro: otros)
- Identificador externo del calendario
- Zona horaria
- Estado de sincronización

**Notas:**
- Cada recurso tiene **un calendario principal**
- El sistema **no gestiona disponibilidad manual**
- La fuente de verdad es el calendario externo

---

### 4. Relación Servicio ↔ Recurso

Define **qué recursos pueden prestar qué servicios**.

**Características:**
- Un servicio puede tener:
  - 1 recurso
  - Varios recursos
- Un recurso puede:
  - Prestar múltiples servicios

**Configuraciones posibles:**
- Servicio con selección explícita de recurso
- Servicio con recurso implícito (ej. cancha única)
- Servicio con asignación automática (futuro)

---

## Modelos de Uso Soportados

### Caso 1 — Servicio + Profesional
Ejemplo: consultorio médico

1. Usuario elige servicio
2. Selecciona profesional
3. Ve disponibilidad del profesional
4. Agenda cita

---

### Caso 2 — Servicio + Recurso físico
Ejemplo: cancha de fútbol

1. Usuario elige servicio
2. Recurso ya está implícito
3. Ve disponibilidad de la cancha
4. Agenda cita

---

### Caso 3 — Servicio con recurso único
Ejemplo: negocio pequeño

- No se muestra selección
- El servicio agenda directamente sobre el único recurso

---

## Integración con Otros Módulos

### Con Web & Content Builder
- Los servicios se muestran como:
  - Listado
  - Página de detalle
- Contenido público + privado (para IA)

---

### Con Agendamiento
- Servicio define:
  - Duración
  - Precio
  - Anticipo
- Recurso define:
  - Disponibilidad
  - Calendario

---

### Con Agente de IA
- El agente puede:
  - Explicar servicios
  - Comparar servicios
  - Responder FAQs
  - Redirigir a agendamiento

---

### Con CRM
- Cada cita queda asociada a:
  - Servicio
  - Recurso
- Permite analíticas por:
  - Servicio
  - Profesional
  - Recurso físico

---

### Con Analytics
- Servicios más consultados
- Servicios más agendados
- Servicios con más dudas
- Recursos con mayor ocupación
- No-shows por servicio / recurso

---

## Flujos Principales

### Flujo 1 — Creación de Servicio
1. Admin define servicio
2. Configura duración y precio
3. Define si permite anticipo
4. Asocia recursos
5. Publica el servicio

---

### Flujo 2 — Creación de Recurso
1. Admin crea recurso
2. Define tipo y sede
3. Conecta Google Calendar
4. Activa el recurso

---

### Flujo 3 — Asociación Servicio ↔ Recurso
- Admin define:
  - Qué servicios presta cada recurso
  - Si el usuario debe elegir recurso o no

---

## Reglas Importantes

- No existe agendamiento sin:
  - Servicio
  - Recurso
  - Calendario
- El precio y duración **vienen del servicio**
- La disponibilidad **viene del recurso**
- El agente IA **solo responde sobre servicios activos**
- Un servicio puede ocultarse sin borrarse

---

## Métricas del Módulo

- Número de servicios activos
- Número de recursos activos
- Ocupación por recurso
- Conversión por servicio
- No-shows por servicio

---

## Consideraciones Futuras

- Servicios paquetizados
- Recursos en paralelo (equipos)
- Reglas avanzadas de asignación
- Disponibilidad híbrida
- Precios variables por recurso

---

## Resultado Esperado

Una estructura clara y flexible que permite:
- Vender servicios simples o complejos
- Escalar desde un profesional único a múltiples sedes
- Alimentar agendamiento, IA, CRM y analytics sin duplicación
