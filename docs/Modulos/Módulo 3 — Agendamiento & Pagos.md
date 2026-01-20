## Objetivo del Módulo

Gestionar el **proceso completo de reserva de citas**, desde la selección del servicio
hasta el control operativo y financiero de la cita.

Este módulo conecta:
- Servicios & Recursos
- Calendarios externos
- CRM
- Post-venta
- Analytics

---

## Responsabilidades

- Permitir a clientes finales reservar citas
- Gestionar disponibilidad real basada en calendarios
- Administrar el ciclo de vida de una cita
- Gestionar pagos anticipados (planes PRO+)
- Exponer estados claros para operación, CRM y analíticas

---

## Alcance Multi-tenant y Planes

- Todas las citas pertenecen a una **Empresa**
- El comportamiento del módulo depende del plan:
  - BASIC: agendamiento sin pago
  - PRO / ENTERPRISE: agendamiento con pago anticipado
- Acceso por rol:
  - Admin / Staff: gestión de citas
  - Viewer: solo lectura

---

## Entidad Principal: Cita (Appointment)

La **Cita** es una entidad central del sistema.

### Relaciones
- Empresa
- Servicio
- Recurso
- Cliente (CRM)
- Calendario externo
- Pagos (si aplica)

---

## Estados de la Cita (Modelo en Dos Dimensiones)

### 1️⃣ Estado Operativo

Describe qué ocurrió con la cita en el tiempo.

Estados posibles:
- **Programada**
- **Confirmada**
- **Reprogramada**
- **Cancelada**
- **Asistida**
- **No asistida**

Características:
- Siempre hay un solo estado operativo activo
- Puede cambiar manual o automáticamente
- Se registra historial de cambios

---

### 2️⃣ Estado Financiero

Describe la situación del pago, independiente del estado operativo.

Estados posibles:
- **No pagado**
- **Parcialmente pagado**
- **Pagado**

Notas:
- Aplica solo a planes PRO / Enterprise
- No depende del estado operativo
- Permite escenarios reales (no-show con anticipo, etc.)

---

## Flujo de Agendamiento (Cliente Final)

### Flujo estándar
1. Cliente accede a la web o agente IA
2. Selecciona servicio
3. Selecciona recurso (si aplica)
4. Visualiza disponibilidad (desde calendario)
5. Selecciona fecha y hora
6. Ingresa datos personales
7. (PRO+) Realiza pago total o parcial
8. Cita creada en el sistema
9. Evento creado en Google Calendar

---

## Integración con Google Calendar

- Cada recurso tiene un calendario asociado
- La disponibilidad se consulta en tiempo real
- Al crear una cita:
  - Se crea un evento en el calendario del recurso
- Al cancelar o reprogramar:
  - Se actualiza el evento correspondiente

**Fuente de verdad de disponibilidad:** Google Calendar

---

## Pagos Anticipados (Planes PRO+)

### Modalidades soportadas
- Sin pago
- Pago parcial (anticipo)
- Pago total

### Reglas
- El monto del anticipo lo define el servicio
- El estado financiero se actualiza según pagos recibidos
- El pago no cambia automáticamente el estado operativo

---

## Cargo por Reserva (Planes PRO+)

- Se aplica un **cargo fijo por cita completada**
- Configurable por plan
- Aplica cuando:
  - La cita es creada exitosamente
- No es porcentaje del pago

---

## Gestión Interna de Citas (Dashboard)

### Acciones permitidas
- Ver citas por fecha / recurso / servicio
- Cambiar estado operativo:
  - Confirmar
  - Cancelar
  - Marcar como asistida / no asistida
- Reprogramar citas
- Visualizar estado financiero
- Acceder al perfil del cliente (CRM)

---

## Relación con Otros Módulos

### Con CRM
- Cada cita:
  - Se asocia a un cliente
  - Actualiza su historial
- Permite métricas por cliente

---

### Con Post-venta
- Dispara:
  - Recordatorios
  - Confirmaciones
  - Feedback post-cita

---

### Con Agente de IA
- El agente:
  - Redirige al flujo de agendamiento
  - Nunca crea citas directamente
- Usa el mismo link de reserva

---

### Con Analytics
- Métricas:
  - Citas creadas
  - Citas asistidas
  - No-shows
  - Impacto del pago anticipado
  - Conversión por servicio / recurso

---

## Reglas Importantes

- No existe cita sin:
  - Servicio
  - Recurso
  - Cliente
- La disponibilidad no se sobreescribe manualmente
- El calendario externo manda
- Estados operativo y financiero son independientes
- Toda transición de estado queda auditada

---

## Casos Borde Considerados

- Cancelación con pago
- No-show con anticipo
- Reprogramación con pago ya realizado
- Pago posterior a la cita
- Servicio desactivado con citas existentes

---

## Métricas del Módulo

- Total de citas por periodo
- Tasa de asistencia
- Tasa de no-show
- % citas con pago anticipado
- Ingresos asegurados vs realizados

---

## Consideraciones Futuras

- Reembolsos automáticos
- Créditos a favor
- Políticas dinámicas por servicio
- Pagos en sitio
- Split payments

---

## Resultado Esperado

Un sistema de agendamiento que:
- Refleja la realidad operativa
- Se integra con calendarios reales
- Maneja pagos sin ambigüedades
- Alimenta CRM, IA y analytics
