## Objetivo del Módulo

Gobernar el producto **comercialmente**:
- Qué funcionalidades están disponibles
- Cuánto y cómo se puede usar el sistema
- Cómo se cobra el servicio

Este módulo habilita el modelo de negocio SaaS sin contaminar
la lógica funcional de los demás módulos.

---

## Rol del Módulo en el Sistema

Planes, Límites & Billing funciona como:

- Controlador de acceso por plan
- Gestor de límites de uso
- Orquestador de cobros recurrentes
- Motor de monetización del producto
- Capa de feature flags transversal

---

## Principios de Diseño

- Separación clara entre **funcionalidad** y **comercialización**
- Feature flags antes que forks de código
- Límites explícitos y visibles para el usuario
- Escalabilidad a nuevos planes
- Precios predecibles (sin comisión porcentual)

---

## Planes del Producto

### Plan BASIC
Pensado para validación y negocios pequeños.

**Incluye:**
- Página web con estructura predefinida
- Branding básico
- Servicios y recursos
- Agendamiento sin pagos
- Google Calendar
- CRM básico
- Analytics básicos
- Recordatorios simples (email)

**No incluye:**
- ❌ Agente de IA
- ❌ Pago anticipado
- ❌ Analíticas avanzadas
- ❌ Post-venta completo

---

### Plan PRO (Plan Principal)
Pensado para negocios que viven de citas.

**Incluye:**
- Todo BASIC
- Agente de IA conversacional (limitado)
- Pagos anticipados (total / parcial)
- CRM completo
- Analíticas avanzadas
- Insights automáticos (simples)
- Post-venta y reputación
- Google Tag Manager
- Integraciones de marketing

**Monetización adicional:**
- Cargo fijo por reserva completada

---

### Plan ENTERPRISE
Pensado para operaciones más complejas.

**Incluye:**
- Todo PRO
- Múltiples sedes
- Mayor capacidad de IA
- Insights avanzados y comparativos
- Reportes automáticos
- Soporte prioritario
- Configuraciones avanzadas

**Monetización:**
- Cargo por reserva reducido o incluido
- Pricing negociado

---

## Feature Flags

Las funcionalidades se activan según:

- Plan
- Rol
- Estado de la cuenta

**Ejemplos:**
- Agente IA → PRO+
- Pago anticipado → PRO+
- Insights avanzados → ENTERPRISE
- Exportación de datos → ENTERPRISE

---

## Límites de Uso

### Tipos de Límites

- Conversaciones con IA
- Tokens de IA
- Número de reservas
- Número de servicios
- Número de prestadores
- Número de sedes
- Retención histórica de datos (futuro)

### Comportamiento ante Límite

- Aviso en dashboard
- Bloqueo parcial (no total)
- Upsell contextual

---

## Billing y Suscripciones

### Modelo de Cobro

- Suscripción mensual / anual
- Cobro recurrente
- Moneda configurable por empresa

### Estados de Suscripción

- Activa
- En prueba
- Vencida
- Suspendida

### Comportamiento ante Impago

- Grace period
- Bloqueo de features PRO
- Conservación de datos

---

## Cargo por Reserva (PRO+)

- Cargo fijo por cita creada exitosamente
- No es porcentaje del pago
- Visible y transparente
- Configurable por plan

**Ejemplo:**
- USD $0.30 – $0.70 por reserva

---

## Integración con Otros Módulos

- Todos los módulos consultan:
  - Plan activo
  - Límites disponibles
- El billing no conoce:
  - Servicios
  - Citas
  - Clientes

Solo gobierna acceso y uso.

---

## UI y Experiencia

- Página de planes clara
- Indicadores de uso en dashboard
- Avisos de límite
- Flujo de upgrade simple
- Sin fricción para escalar

---

## Métricas del Módulo

- Conversión por plan
- Churn
- Upgrades / downgrades
- Uso de límites
- Revenue por cliente
- Revenue por feature

---

## Consideraciones Futuras

- Add-ons por módulo
- Precios por industria
- Bundles de IA
- Descuentos por volumen
- Marketplace de integraciones

---

## Resultado Esperado

Un sistema de planes que:
- Sostiene el negocio
- No complica el producto
- Incentiva el upgrade natural
- Es transparente para el cliente
- Escala con el crecimiento del SaaS
