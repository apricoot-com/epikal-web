import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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
    console.log("👤 Creating admin user...");

    const adminUser = await prisma.user.create({
        data: {
            name: "Dra. Sofía Mendoza",
            email: "sofia@clinica-aurora.com",
            emailVerified: true,
            status: "ACTIVE",
        },
    });

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

    const staffUser = await prisma.user.create({
        data: {
            name: "María García",
            email: "maria@clinica-aurora.com",
            emailVerified: true,
            status: "ACTIVE",
        },
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
                    content: "Disfruta de una experiencia rejuvenecedora...",
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
