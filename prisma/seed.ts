import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

/**
 * Seed script for Epikal database
 * Refined version for full system testing
 */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting full database seed...\n");

    // Clean existing data
    console.log("🧹 Cleaning existing data...");
    await prisma.userCompany.deleteMany();
    await prisma.companyBranding.deleteMany();
    await prisma.location.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.blockout.deleteMany();
    await prisma.serviceResource.deleteMany();
    await prisma.serviceWebPage.deleteMany();
    await prisma.service.deleteMany();
    await prisma.resource.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // =========================================================================
    // 1. PROJECT ADMIN COMPANY (System Level)
    // =========================================================================
    console.log("🚀 Creating System HQ...");
    const systemCompany = await prisma.company.create({
        data: {
            name: "Epikal Headquarters",
            slug: "system",
            status: "ACTIVE",
            language: "es",
            currency: "USD",
            timezone: "UTC",
        },
    });

    // =========================================================================
    // 2. DEMO CLINIC COMPANY (Tenant Level)
    // =========================================================================
    console.log("🏢 Creating demo company: Clínica Aurora...");
    const company = await prisma.company.create({
        data: {
            name: "Clínica Aurora",
            legalName: "Aurora Estética S.A. de C.V.",
            slug: "clinica-aurora",
            status: "ACTIVE",
            language: "es",
            currency: "MXN",
            timezone: "America/Mexico_City",
        },
    });

    // =========================================================================
    // 3. USERS (4 Levels)
    // =========================================================================
    console.log("👤 Creating user accounts...");

    const usersData = [
        { email: "superadmin@epikal.com", name: "Super Admin", role: "SUPERADMIN", companyId: systemCompany.id },
        { email: "admin@clinica-aurora.com", name: "Dra. Clínica Admin", role: "OWNER", companyId: company.id },
        { email: "pro1@clinica-aurora.com", name: "María Profesional", role: "STAFF", companyId: company.id },
        { email: "pro2@clinica-aurora.com", name: "Laura Profesional", role: "STAFF", companyId: company.id },
    ];

    for (const u of usersData) {
        await auth.api.signUpEmail({
            body: {
                email: u.email,
                password: "password123",
                name: u.name,
            }
        });

        const createdUser = await prisma.user.findUnique({ where: { email: u.email } });
        if (createdUser) {
            await prisma.user.update({
                where: { id: createdUser.id },
                data: { emailVerified: true }
            });

            await prisma.userCompany.create({
                data: {
                    userId: createdUser.id,
                    companyId: u.companyId,
                    role: u.role as any,
                    status: "ACTIVE",
                },
            });
            console.log(`   ✓ Created ${u.role}: ${u.name}`);
        }
    }

    // =========================================================================
    // 4. LOCATIONS & RESOURCES
    // =========================================================================
    console.log("📍 Setting up clinic infrastructure...");

    const location = await prisma.location.create({
        data: {
            companyId: company.id,
            name: "Sede Central Polanco",
            address: "Av. Masaryk 123",
            city: "CDMX",
            country: "México",
        },
    });

    const resource1 = await prisma.resource.create({
        data: {
            companyId: company.id,
            locationId: location.id,
            type: "PROFESSIONAL",
            name: "María Profesional",
            status: "ACTIVE",
        }
    });

    const resource2 = await prisma.resource.create({
        data: {
            companyId: company.id,
            locationId: location.id,
            type: "PROFESSIONAL",
            name: "Laura Profesional",
            status: "ACTIVE",
        }
    });

    // =========================================================================
    // 5. SERVICES & AVAILABILITY
    // =========================================================================
    console.log("💆‍♀️ Setting up services...");

    const service = await prisma.service.create({
        data: {
            companyId: company.id,
            name: "Limpieza Facial Profunda",
            duration: 60,
            price: 850.00,
            isPublic: true,
            resources: {
                create: [
                    { resource: { connect: { id: resource1.id } } },
                    { resource: { connect: { id: resource2.id } } }
                ]
            }
        }
    });

    // Standard availability (M-F, 9-18)
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    for (const rId of [resource1.id, resource2.id]) {
        for (const day of days) {
            await prisma.availability.create({
                data: {
                    resourceId: rId,
                    dayOfWeek: day as any,
                    startTime: "09:00",
                    endTime: "18:00",
                    isAvailable: true
                }
            });
        }
    }

    // =========================================================================
    // 6. CUSTOMERS & MULTI-STATE BOOKINGS
    // =========================================================================
    console.log("📅 Generating multi-state bookings for testing...");

    const customer = await prisma.customer.create({
        data: {
            companyId: company.id,
            firstName: "Juan",
            lastName: "Pruebas",
            email: "juan@pruebas.com",
            phone: "+52 55 0000 0000",
        }
    });

    const now = new Date();

    // 1. Past & Completed
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 1);
    pastDate.setHours(10, 0, 0, 0);

    await prisma.booking.create({
        data: {
            companyId: company.id,
            resourceId: resource1.id,
            serviceId: service.id,
            customerId: customer.id,
            startTime: pastDate,
            endTime: new Date(pastDate.getTime() + 3600000),
            status: "COMPLETED",
            customerName: "Juan Pruebas",
            customerEmail: "juan@pruebas.com"
        }
    });

    // 2. Past & Confirmed (Should show "Asistió" buttons)
    const pendingDate = new Date(now);
    pendingDate.setHours(now.getHours() - 1, 0, 0, 0); // Started 1 hour ago

    await prisma.booking.create({
        data: {
            companyId: company.id,
            resourceId: resource1.id,
            serviceId: service.id,
            customerId: customer.id,
            startTime: pendingDate,
            endTime: new Date(pendingDate.getTime() + 3600000),
            status: "CONFIRMED",
            customerName: "Juan Pruebas",
            customerEmail: "juan@pruebas.com"
        }
    });

    // 3. Past & No Show
    const noShowDate = new Date(now);
    noShowDate.setDate(now.getDate() - 2);
    noShowDate.setHours(14, 0, 0, 0);

    await prisma.booking.create({
        data: {
            companyId: company.id,
            resourceId: resource2.id,
            serviceId: service.id,
            customerId: customer.id,
            startTime: noShowDate,
            endTime: new Date(noShowDate.getTime() + 3600000),
            status: "NO_SHOW",
            customerName: "Juan Pruebas",
            customerEmail: "juan@pruebas.com"
        }
    });

    // 4. Future & Confirmed
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 1);
    futureDate.setHours(11, 0, 0, 0);

    await prisma.booking.create({
        data: {
            companyId: company.id,
            resourceId: resource2.id,
            serviceId: service.id,
            customerId: customer.id,
            startTime: futureDate,
            endTime: new Date(futureDate.getTime() + 3600000),
            status: "CONFIRMED",
            customerName: "Juan Pruebas",
            customerEmail: "juan@pruebas.com"
        }
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ Refined Seed completed successfully!\n");
    console.log("🔑 Test Credentials (password: password123):");
    console.log(`   - Super Admin: superadmin@epikal.com`);
    console.log(`   - Clinic Admin: admin@clinica-aurora.com`);
    console.log(`   - Professional 1: pro1@clinica-aurora.com`);
    console.log(`   - Professional 2: pro2@clinica-aurora.com`);
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
