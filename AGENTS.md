# AGENTS.md — Epikal

## Purpose

Este archivo define **cómo deben operar los agentes de IA dentro del proyecto Epikal**.

Epikal es un **SaaS multi-tenant para negocios de servicios**, con una arquitectura modular,
orientada a confiabilidad, escalabilidad y claridad de dominio.

Los agentes de IA **no improvisan arquitectura**: siguen este documento y los archivos en `/docs`.

---

## Fuente de Verdad

Antes de hacer cualquier acción, el agente **DEBE** revisar:

- `/docs/1. Producto.md`
- `/docs/2. Técnico.md`
- `/docs/3. Implementation plan.md`
- `/docs/Modulos/` (Módulos 1 al 9)

Estos documentos definen:
- Qué es Epikal
- Cómo está diseñado
- En qué orden se construye
- Qué responsabilidades tiene cada módulo

Si hay conflicto entre una instrucción y los docs → **los docs ganan**.

---

## Modelo Mental de Epikal

Epikal **no es una app monolítica de features**, es un sistema compuesto por **módulos bien definidos**.

### Módulos funcionales (dominio)

1. Core de Empresa (multi-tenant, usuarios, roles)
2. Servicios & Recursos
3. Agendamiento & Pagos
4. CRM
5. Agente de Inteligencia Artificial
6. Analytics & Insights
7. Post-venta & Reputación
8. Planes, Límites & Billing
9. Configurador de Sitios Web

Cada módulo:
- Vive en su propio dominio
- Expone su lógica vía tRPC
- No conoce implementaciones de infraestructura

---

## Capas del Sistema

### 1. Capa Transversal (Infraestructura)

Esta capa **no contiene lógica de negocio**.

Incluye:
- Autenticación y autorización
- Contexto multi-tenant
- Providers abstractos:
  - Storage (S3 / local)
  - Mail (MailHog / proveedor real)
  - Queues (Redis)
- Feature flags y planes
- Event bus interno
- Cache y rate limiting

📌 **Regla clave:**  
El dominio depende de interfaces, nunca de implementaciones concretas.

---

### 2. Capa de Dominio

Aquí vive la lógica del negocio:
- Servicios
- Citas
- Clientes
- Estados
- Reglas

El dominio:
- Usa Prisma
- Usa tRPC
- Emite eventos
- Nunca importa infraestructura concreta

---

### 3. Capa de Orquestación (el agente)

El agente de IA actúa como **orquestador**, no como ejecutor ciego.

Su rol es:
- Leer los documentos
- Decidir qué módulo o fase aplicar
- Proponer cambios coherentes
- Detectar inconsistencias
- Pedir aclaraciones cuando algo no está definido

---

## Uso de tRPC

- tRPC es la **única capa API**
- Frontend y backend comparten tipos
- Cada módulo tiene su router
- El contexto tRPC siempre incluye:
  - Usuario (si existe)
  - Empresa activa
  - Prisma client
  - Plan / feature flags

Los agentes **no crean endpoints REST paralelos**.

---

## Multi-tenant (Regla Absoluta)

- Todo dato pertenece a una **Empresa**
- Toda query debe estar filtrada por `companyId`
- Un usuario puede pertenecer a múltiples empresas
- Los roles son por empresa

Si una propuesta rompe el aislamiento de tenants → **es inválida**.

---

## Infraestructura Abstracta

Epikal **no se acopla a proveedores**.

Todo acceso externo se hace vía interfaces:

- `StorageProvider`
- `MailProvider`
- `QueueProvider`

Los agentes:
- Pueden definir interfaces
- Pueden proponer implementaciones
- **Nunca** deben usar un SDK directamente en el dominio

---

## Flujo de Trabajo Esperado para un Agente

1. Leer los documentos relevantes en `/docs`
2. Identificar el módulo o fase correspondiente
3. Verificar dependencias previas
4. Proponer cambios alineados con la arquitectura
5. Si algo falla:
   - Analizar
   - Ajustar
   - Documentar el aprendizaje

---

## Qué NO debe hacer un agente

- No introducir lógica fuera de módulos
- No saltarse fases del implementation plan
- No crear “shortcuts” técnicos
- No mezclar UI con dominio
- No asumir decisiones no documentadas

---

## Aprendizaje y Evolución

Epikal es un sistema vivo.

Si un agente descubre:
- Un edge case
- Una restricción técnica
- Una mejora estructural

Debe:
1. Explicarla claramente
2. Proponer el cambio
3. Sugerir dónde documentarlo en `/docs`

Nunca aplicar cambios silenciosos.

---

## Regla Final

> **Epikal prioriza claridad, coherencia y arquitectura por encima de velocidad.**

Los agentes están aquí para **fortalecer el sistema**, no para improvisar.

Be precise. Be consistent. Build Epikal right.
