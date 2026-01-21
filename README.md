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
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🔑 Demo Credentials

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| **Admin (Owner)** | `sofia@clinica-aurora.com` | `password123` |
| **Staff** | `maria@clinica-aurora.com` | `password123` |

> The seed script automatically creates these accounts. If you need to reset them, just run `npx prisma db seed` again.

---

## 🌐 Test Sites (Templating Engine)

- **Main Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Demo Clinic Site (Public)**: [http://clinica-aurora.localhost:3000](http://clinica-aurora.localhost:3000)

---

## Architecture Modules
- **Module 1**: Company Core (Users, Roles, Locations)
- **Module 2**: Services & Resources (Professionals, Facilities)
- **Module 3**: Web Pages (11ty-style Templating Engine)
