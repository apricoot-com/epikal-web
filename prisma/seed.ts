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

    console.log(`   ✓ User created: ${staffUser.name} as STAFF`);

    // =========================================================================
    // SUMMARY
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
