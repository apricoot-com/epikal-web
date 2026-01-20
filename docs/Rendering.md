# Sistema de Rendering de Páginas Web — Eleventy Templates

## Objetivo

Definir cómo Epikal genera y sirve las **páginas web públicas** de los clientes,
priorizando:

- Velocidad extrema de carga
- Simplicidad de despliegue
- Escalabilidad multi-tenant
- Separación clara entre contenido, datos y lógica

---

## Principio General

Las páginas web públicas de Epikal:

- **NO son apps React**
- **NO se renderizan en runtime con SSR**
- **NO dependen del dashboard**

Son **HTML plano precompilado**, servido desde un mismo clúster,
con **datos inyectados dinámicamente** por cliente.

---

## Elección Tecnológica: Eleventy (11ty)

Se utiliza **Eleventy (11ty)** como motor de templates estáticos.

Razones:
- Genera HTML extremadamente liviano
- Es rápido y predecible
- No introduce complejidad en runtime
- Ideal para sitios de servicios orientados a conversión

---

## Modelo de Templates

### Templates como Paquetes

- Cada template es un **paquete autocontenido**
- Se distribuye como:
  - ZIP
  - o repo versionado

El paquete contiene:
- Templates Eleventy (`.njk`, `.liquid`, etc.)
- Assets base (CSS, JS)
- Definiciones de variables
- Estructura de secciones (hero, servicios, FAQs, etc.)

---

## Proceso de Compilación

1. El template se **compila una vez**
2. Eleventy genera:
   - HTML base
   - placeholders de variables
3. El resultado se guarda como **template renderizable**

👉 **No se recompila por cliente**.

---

## Modelo de Rendering en Runtime

### Flujo de Request

1. Llega una request HTTP al dominio del cliente
2. El servidor identifica:
   - Empresa (tenant) por dominio
3. Se carga:
   - Template base (HTML)
   - Datos del cliente (branding, servicios, contenido)
4. Se **inyectan los datos** en el HTML
5. Se responde:
   - HTML plano
   - + JavaScript mínimo embebido

---

## Inyección de Contenido

### Qué se inyecta

- Contenido textual
- Listado de servicios
- FAQs
- Datos de contacto
- Links de agendamiento
- Configuración del agente IA
- Variables de analytics

---

### Variables de Estilo (CSS Variables)

El branding se inyecta como **CSS Variables**:

Ejemplos:
- `--color-primary`
- `--color-secondary`
- `--background-color`
- `--text-color`
- `--border-radius`
- `--font-family`

Estas variables:
- Vienen del Core de Empresa
- Se inyectan directamente en el HTML
- Controlan el look & feel sin recompilar nada

---

## JavaScript Embebido

Cada página incluye un **JS liviano**, responsable de:

- Hidratar contenido dinámico (si aplica)
- Inicializar:
  - Agente de IA
  - Tracking (UTMs, analytics)
- Manejar interacciones básicas
- Enviar eventos a Epikal (conversiones, clicks)

👉 No es un framework, es **JS plano y controlado**.

---

## Multi-tenant y Dominios

- Todos los clientes viven en el **mismo clúster**
- Cada cliente:
  - Apunta su dominio a Epikal
- El sistema resuelve:
  - Dominio → Empresa → Template → Datos

No hay:
- Despliegues por cliente
- Builds por cliente
- Infra duplicada

---

## Ventajas del Enfoque

### Performance
- HTML plano
- Time-to-first-byte mínimo
- Excelente SEO

### Escalabilidad
- Un solo runtime
- Miles de clientes con el mismo setup

### Simplicidad Operativa
- Templates versionados
- Datos separados del layout
- Sin SSR complejo

### Flexibilidad de Diseño
- Templates intercambiables
- Branding dinámico
- Cambios sin rebuild

---

## Relación con el Dashboard (Next.js)

- El dashboard **NO sirve páginas públicas**
- El dashboard:
  - Administra contenido
  - Administra branding
  - Administra templates
- El renderer web:
  - Solo lee datos
  - No tiene lógica de negocio

---

## Relación con IA y Analytics

- El HTML incluye:
  - Contexto mínimo para IA
  - Identificadores de empresa
- El JS:
  - Reporta eventos
  - Inicia conversaciones
- El agente IA **no vive en la página**, se consume como servicio

---

## Reglas Importantes

- Nunca renderizar React en páginas públicas
- Nunca compilar templates por request
- Nunca mezclar lógica del dashboard con el renderer
- El HTML debe ser válido y cacheable
- El JS debe ser mínimo y auditable

---

## Resultado Esperado

Un sistema de páginas web que:

- Carga en milisegundos
- Escala a miles de clientes
- Mantiene coherencia visual
- Convierte mejor
- No agrega complejidad innecesaria
