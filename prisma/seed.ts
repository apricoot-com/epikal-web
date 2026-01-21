import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { auth } from "../src/lib/auth";

async function hashPassword(password: string) {
    // Basic Scrypt hash compliant with many auth systems
    // Format: salt:key
    const salt = crypto.randomBytes(16).toString("hex");
    const key = (await new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey);
        });
    })).toString("hex");
    return `${salt}:${key}`;
}

/**
 * Seed script for Epikal database
 * 
 * Run with: npx ts-node --esm prisma/seed.ts
 * Or via npm: npm run db:seed
 * 
 * This script creates a demo aesthetics clinic with:
 * - Company (tenant)
 * - Admin user
 * - Branding
 * - Locations
 */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seed...\n");

    // Clean existing data (for development)
    console.log("🧹 Cleaning existing data...");
    await prisma.userCompany.deleteMany();
    await prisma.companyBranding.deleteMany();
    await prisma.location.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // =========================================================================
    // COMPANY: Clínica Estética Aurora
    // =========================================================================
    console.log("🏢 Creating company: Clínica Estética Aurora...");

    const company = await prisma.company.create({
        data: {
            name: "Clínica Estética Aurora",
            legalName: "Aurora Estética S.A. de C.V.",
            slug: "clinica-aurora",
            customDomain: null,
            status: "ACTIVE",
            language: "es",
            currency: "MXN",
            timezone: "America/Mexico_City",
            socialUrls: {
                facebook: "https://facebook.com/clinicaaurora",
                instagram: "https://instagram.com/clinicaaurora",
                twitter: "https://x.com/clinicaaurora",
                linkedin: "https://linkedin.com/company/clinicaaurora",
                tiktok: "https://tiktok.com/@clinicaaurora"
            }
        },
    });

    console.log(`   ✓ Company created: ${company.name} (${company.id})`);

    // =========================================================================
    // BRANDING
    // =========================================================================
    console.log("🎨 Creating branding...");

    const branding = await prisma.companyBranding.create({
        data: {
            companyId: company.id,
            logoUrl: null, // To be uploaded later
            primaryColor: "#9333EA",    // Purple
            secondaryColor: "#F472B6",  // Pink
            brandTone: "profesional y cercano",
            brandKeywords: [
                "belleza",
                "rejuvenecimiento",
                "bienestar",
                "cuidado personal",
                "resultados naturales",
            ],
            brandRestrictions: [
                "cirugía invasiva",
                "resultados garantizados",
                "precios bajos",
            ],
        },
    });

    console.log(`   ✓ Branding created (${branding.id})`);

    // =========================================================================
    // LOCATIONS
    // =========================================================================
    console.log("📍 Creating locations...");

    const locationPolanco = await prisma.location.create({
        data: {
            companyId: company.id,
            name: "Aurora Polanco",
            address: "Av. Presidente Masaryk 123, Polanco V Sección",
            city: "Ciudad de México",
            country: "México",
            phone: "+52 55 1234 5678",
            email: "polanco@clinica-aurora.com",
        },
    });

    const locationSantaFe = await prisma.location.create({
        data: {
            companyId: company.id,
            name: "Aurora Santa Fe",
            address: "Centro Comercial Santa Fe, Local 456",
            city: "Ciudad de México",
            country: "México",
            phone: "+52 55 8765 4321",
            email: "santafe@clinica-aurora.com",
        },
    });

    console.log(`   ✓ Location created: ${locationPolanco.name}`);
    console.log(`   ✓ Location created: ${locationSantaFe.name}`);

    // =========================================================================
    // ADMIN USER
    // =========================================================================
    // =========================================================================
    // ADMIN USER (Use Auth API for proper hashing)
    // =========================================================================
    console.log("👤 Creating admin user...");

    // We import auth dynamically or use a workaround if ESM troubles occur,
    // but assuming standard usage:
    // Actually, in a seed script running with tsx, we might not have the full server context 
    // (headers, request) that auth.api expects, but typically signUpEmail works without it
    // or mocks it. 
    // However, if that fails, we fallback to the known Scrypt hash which IS the Better Auth default.
    // The previous hash failed because maybe Better Auth V1 uses Argon2?
    // Let's force a trusted hash format if we can't use the API.

    // WAIT! Better Auth documentation says it uses Scrypt by default.
    // Maybe the salt separator is different or parameters are different.

    // Let's try to use the API directly.
    // Importing auth from src/lib/auth might fail due to @ alias in tsx without tsconfig path resolution.
    // We need to assume tsx handles it or use relative path if needed.
    // Let's try importing relative.

    // Since we are inside prisma/seed.ts, ../src/lib/auth should work.

    // But wait, `auth` relies on database adapter which relies on `prisma` client.
    // It should work.

    // NOTE: We will keep the hashPassword function as a fallback or if we decide to stick to manual.
    // But clearly manual failed. 
    // Let's try to simulate the user creation via a helper that uses better-auth/api 
    // but actually, we can just use the internal `auth.api.signUpEmail` if we can import `auth`.

    // Replacing manual creation with:

    const adminUserRes = await auth.api.signUpEmail({
        body: {
            email: "sofia@clinica-aurora.com",
            password: "password123",
            name: "Dra. Sofía Mendoza",
        },
        asResponse: true // Try to get full response or object
    });

    // signUpEmail returns the created user session/user object usually.
    // But since it's an API call wrapper, it might return a response object.
    // Let's assume we can fetch the user by email after creation to link it.

    // WAIT: `auth.api` is not available on the client instance, but on the server instance `auth`.
    // We need to import `auth` from `../src/lib/auth`.

    const adminUser = await prisma.user.findUnique({ where: { email: "sofia@clinica-aurora.com" } });
    if (!adminUser) throw new Error("Admin user creation failed via Auth API");

    console.log(`   ✓ User created: ${adminUser.name} (${adminUser.email})`);

    // =========================================================================
    // USER-COMPANY MEMBERSHIP (Owner)
    // =========================================================================
    console.log("🔗 Creating user-company membership...");

    const membership = await prisma.userCompany.create({
        data: {
            userId: adminUser.id,
            companyId: company.id,
            role: "OWNER",
            status: "ACTIVE",
        },
    });

    console.log(`   ✓ Membership created: ${adminUser.name} as OWNER`);

    // =========================================================================
    // STAFF USER
    // =========================================================================
    console.log("👤 Creating staff user...");

    await auth.api.signUpEmail({
        body: {
            email: "maria@clinica-aurora.com",
            password: "password123",
            name: "María García",
        }
    });

    const staffUser = await prisma.user.findUnique({ where: { email: "maria@clinica-aurora.com" } });
    if (!staffUser) throw new Error("Staff user creation failed via Auth API");

    await prisma.user.update({
        where: { id: staffUser.id },
        data: { emailVerified: true }
    });
    // Manually verify admin too
    await prisma.user.update({
        where: { id: adminUser.id },
        data: { emailVerified: true }
    });

    await prisma.userCompany.create({
        data: {
            userId: staffUser.id,
            companyId: company.id,
            role: "STAFF",
            status: "ACTIVE",
        },
    });

    // =========================================================================
    // RESOURCES (Professionals & Facilities)
    // =========================================================================
    console.log("👩‍⚕️ Creating resources...");

    const profMaria = await prisma.resource.create({
        data: {
            companyId: company.id,
            locationId: locationPolanco.id,
            type: "PROFESSIONAL",
            name: "María García", // Reuse user logic ideally, but simplest to double entry for now
            status: "ACTIVE",
        }
    });

    const profLaura = await prisma.resource.create({
        data: {
            companyId: company.id,
            locationId: locationPolanco.id,
            type: "PROFESSIONAL",
            name: "Dra. Laura Torres",
            status: "ACTIVE",
        }
    });

    const roomFacial = await prisma.resource.create({
        data: {
            companyId: company.id,
            locationId: locationPolanco.id,
            type: "PHYSICAL",
            name: "Cabina de Faciales",
            status: "ACTIVE",
        }
    });

    console.log(`   ✓ Resources created: 2 Professionals, 1 Physical`);

    // =========================================================================
    // SERVICES
    // =========================================================================
    console.log("💆‍♀️ Creating services...");

    const serviceFacial = await prisma.service.create({
        data: {
            companyId: company.id,
            name: "Limpieza Facial Profunda",
            description: "Tratamiento completo para renovar tu piel",
            duration: 60,
            price: 850.00,
            isPublic: true,
            status: "ACTIVE",
            webPage: {
                create: {
                    slug: "facial-profundo",
                    displayTitle: "Limpieza Facial Premium",
                    heroImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=2070",
                    content: `
### Tu piel merece lo mejor

Nuestro facial profundo es un tratamiento de **60 minutos** diseñado para purificar, hidratar y revitalizar la piel de tu rostro.

#### ¿Qué incluye?
*   **Doble limpieza**: Eliminamos impurezas superficiales.
*   **Vapor ozono**: Abre los poros para una extracción efectiva.
*   **Extracción manual**: Cuidadosa y detallada.
*   **Alta frecuencia**: Acción bactericida y calmante.
*   **Mascarilla hidratante**: Personalizada según tu tipo de piel.
*   **Masaje relajante**: Facial y craneal para desconectar.

Ideal para *todo tipo de piel*. Recomendamos realizar este tratamiento una vez al mes para mantener resultados óptimos.
`,
                    faqs: [
                        {
                            question: "¿Duele la extracción?",
                            answer: "Puede ser ligeramente molesta pero no dolorosa. Nuestras esteticistas son muy cuidadosas."
                        },
                        {
                            question: "¿Puedo maquillarme después?",
                            answer: "Recomendamos esperar al menos 12 horas para dejar respirar tu piel."
                        },
                        {
                            question: "¿Con qué frecuencia debo hacérmelo?",
                            answer: "Para mejores resultados, recomendamos una vez al mes."
                        }
                    ]
                }
            },
            resources: {
                create: [
                    { resource: { connect: { id: profMaria.id } } },
                    { resource: { connect: { id: roomFacial.id } } }
                ]
            }
        },
        include: { webPage: true }
    });

    const serviceMassage = await prisma.service.create({
        data: {
            companyId: company.id,
            name: "Masaje Relajante",
            description: "Masaje de cuerpo completo con aromaterapia",
            duration: 50,
            price: 1200.00,
            isPublic: true,
            status: "ACTIVE",
            webPage: {
                create: {
                    slug: "masaje-relajante",
                    displayTitle: "Masaje Relajante Holístico",
                    heroImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=2070",
                    content: "Relaja tus sentidos con nuestra técnica exclusiva...",
                }
            },
            resources: {
                create: [
                    { resource: { connect: { id: profLaura.id } } }
                ]
            }
        },
        include: { webPage: true }
    });

    console.log(`   ✓ Services created: ${serviceFacial.name}, ${serviceMassage.name}`);

    // =========================================================================
    // TEMPLATES
    // =========================================================================
    console.log("📄 Creating default template...");

    const template = await prisma.template.create({
        data: {
            name: "Default Minimal",
            description: "A simple testing template",
            storagePath: "default",
            isPublic: true,
        }
    });

    await prisma.company.update({
        where: { id: company.id },
        data: { siteTemplateId: template.id }
    });

    console.log(`   ✓ Template created and assigned: ${template.name}`);
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ Seed completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   • Companies: 1`);
    console.log(`   • Users: 2`);
    console.log(`   • Locations: 2`);
    console.log("\n🔑 Test credentials:");
    console.log(`   Email: sofia@clinica-aurora.com`);
    console.log(`   (No password set - use Better Auth flow)`);
    console.log("=".repeat(60) + "\n");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
