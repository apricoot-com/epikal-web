# Epikal Web

Plataforma SaaS para gestión de clínicas estéticas y salones de belleza.

## 🚀 Getting Started

### 1. Prerequisites
- Docker & Docker Compose (for database)
- Node.js 18+

### 2. Setup Environment
```bash
# Start Infrastructure (Postgres, Redis, MailHog)
docker-compose up -d

# Install Dependencies
npm install

# Setup Database Schema
npx prisma generate
npx prisma db push
```

### 3. Seed Database (Demo Data)
Populates the database with a test company, users, services, resources, and templates.
**Note:** This command clears existing data to ensure a clean state!

```bash
# Build Templates
npx tsx scripts/build-templates.ts

# Seed Database
npm run db:seed
```

Para más detalles sobre los roles, credenciales de prueba y configuración del entorno de desarrollo, consulta [docs/setup-seed.md](file:///Users/roman/Workspace/apricoot/epikal-web/docs/setup-seed.md).

### 4. Run Development Server
```bash
npm run dev
```

---

## 🔑 Demo Credentials

Consulta el listado completo de roles y usuarios de prueba en [docs/setup-seed.md](file:///Users/roman/Workspace/apricoot/epikal-web/docs/setup-seed.md).

> El script de semilla limpia los datos existentes para asegurar un estado consistente. Si necesitas restablecerlos, simplemente ejecuta `npm run db:seed`.

---

## 🌐 Test Sites (Templating Engine)

- **Main Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Demo Clinic Site (Public)**: [http://clinica-aurora.localhost:3000](http://clinica-aurora.localhost:3000)

---

## Architecture Modules
- **Module 1**: Company Core (Users, Roles, Locations)
- **Module 2**: Services & Resources (Professionals, Facilities)
- **Module 3**: Web Pages (11ty-style Templating Engine)
