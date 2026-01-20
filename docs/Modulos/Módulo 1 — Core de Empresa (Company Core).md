## Objetivo del Módulo

El Core de Empresa define el **contexto global del sistema** en un entorno
**SaaS multi-tenant**, y actúa como la **fuente de verdad organizacional**.

Este módulo:
- No gestiona operación
- No gestiona citas
- No gestiona clientes finales

Pero **habilita y gobierna todo lo anterior**.

---

## Contexto SaaS Multi-tenant

- El sistema es **multi-tenant**
- Cada **Empresa** representa un tenant lógico
- Todos los datos del sistema están aislados por Empresa
- Un mismo usuario puede pertenecer a múltiples empresas
- Los permisos se definen **por empresa**

---

## Responsabilidades del Módulo

- Crear y administrar empresas (tenants)
- Definir identidad, marca y contexto estratégico
- Capturar el brief de marketing
- Definir reglas y políticas globales
- Gestionar usuarios y roles por empresa
- Definir sedes / ubicaciones
- Exponer contexto base a todos los módulos

---

## Principios de Diseño

- El Core **no conoce** detalles operativos
- El Core **no tiene lógica de negocio específica**
- El Core **provee contexto**, no comportamiento
- Todo lo demás **depende** del Core

---

## Entidades Principales

### 1. Empresa (Tenant)

Representa una cuenta cliente del SaaS.

**Atributos clave:**
- ID de empresa
- Nombre comercial
- Razón social (opcional)
- Estado (activa / suspendida)
- Dominio / subdominio público
- Idioma principal
- Moneda
- Zona horaria
- Fecha de creación

**Notas:**
- Toda entidad del sistema referencia una Empresa
- La Empresa define el scope de datos y operación

---

### 2. Usuario

Representa una persona que accede al SaaS.

**Atributos:**
- ID de usuario
- Nombre
- Email
- Estado (activo / bloqueado)
- Fecha de creación

**Notas:**
- El usuario no tiene permisos globales
- El acceso siempre está mediado por Empresa

---

### 3. Membresía Usuario–Empresa

Conecta usuarios con empresas.

**Atributos:**
- Usuario
- Empresa
- Rol
- Estado (activo / invitado / revocado)

**Permite:**
- Un usuario en múltiples empresas
- Roles distintos por empresa

---

### 4. Roles

Los roles son **por empresa**.

#### Roles base

- **Owner**
  - Control total
  - Billing y planes
  - Configuración global

- **Admin**
  - Configuración operativa
  - Gestión de módulos funcionales

- **Staff**
  - Operación diaria
  - Gestión de citas y clientes

- **Viewer**
  - Acceso solo lectura
  - Analytics y reportes

> Los roles gobiernan acceso a módulos, vistas y acciones.

---

### 5. Branding de Empresa

Define la identidad visual y verbal.

**Atributos:**
- Logo
- Colores primarios
- Colores secundarios
- Tipografía base (opcional)
- Voz de marca:
  - Tono
  - Palabras clave
  - Restricciones de lenguaje

**Uso transversal:**
- Web pública
- Generación de contenido IA
- Agente conversacional
- Comunicaciones automáticas

---

### 6. Brief de Marketing (Contexto Estratégico)

Información capturada mediante onboarding guiado.

**Contenido típico:**
- Qué vende la empresa
- Público objetivo
- Problema principal
- Propuesta de valor
- Diferenciadores
- Objeciones frecuentes
- Preguntas frecuentes reales
- Servicios prioritarios (conceptuales)
- Competidores (opcional)

**Características:**
- Editable
- Persistente
- Fuente principal de contexto para IA

> El brief **no define servicios**, solo contexto.

---

### 7. Políticas del Negocio

Reglas globales que afectan módulos operativos.

**Ejemplos:**
- Política de cancelación
- Política de reembolsos
- Política de no-show
- Tiempo mínimo para cancelar
- Reglas generales de pago anticipado

**Uso:**
- Agendamiento
- Post-venta
- IA (respuestas informativas)

---

### 8. Sedes / Ubicaciones

Define la estructura física del negocio.

**Atributos:**
- Nombre de la sede
- Dirección
- Ciudad / país
- Horarios generales
- Datos de contacto

**Notas:**
- No define disponibilidad
- Es contexto, no agenda

---

## Flujos Principales

### Flujo 1 — Creación de Empresa
1. Usuario se registra
2. Se crea Empresa
3. Usuario queda como Owner
4. Se inicia onboarding

---

### Flujo 2 — Onboarding Inicial
1. Datos básicos de la empresa
2. Captura del brief de marketing
3. Carga de branding
4. Configuración mínima de políticas
5. Empresa lista para configurar módulos operativos

---

### Flujo 3 — Gestión de Usuarios
- Owner / Admin puede:
  - Invitar usuarios
  - Asignar roles
  - Cambiar roles
  - Revocar accesos

---

## Relación con Otros Módulos

El Core de Empresa es **dependencia directa** de:

- Servicios & Recursos
- Agendamiento & Pagos
- CRM
- Agente de IA
- Analytics
- Post-venta
- Billing y planes

El Core **no depende** de ningún módulo funcional.

---

## Reglas Importantes

- No existen servicios sin empresa
- No existen citas sin empresa
- Todo acceso está mediado por rol
- El brief es un activo vivo
- El branding es transversal y obligatorio

---

## Métricas del Módulo

- % onboarding completado
- Nivel de completitud del brief
- Nivel de branding configurado
- Número de usuarios por empresa
- Distribución de roles

---

## Consideraciones Futuras

- Multimarca por empresa
- Roles personalizados
- Idiomas múltiples
- Versionado del brief
- Delegación por sede

---

## Resultado Esperado

Una base sólida que:
- Aísla correctamente tenants
- Provee contexto estratégico real
- Permite escalar servicios, prestadores y citas
- Mantiene coherencia en todo el sistema
