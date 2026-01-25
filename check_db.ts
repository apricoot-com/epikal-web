import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
async function main() {
    console.log("Checking columns in 'services' table...");
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'services'
            ORDER BY column_name;
        `;
        console.table(columns);

        console.log("\nTesting prisma.$queryRaw selecting all from services...");
        const rawServices = await prisma.$queryRaw`SELECT * FROM services LIMIT 1`;
        console.log("Success! Raw services found:", (rawServices as any)[0]?.name);

        console.log("\nChecking columns in 'service_web_pages' table...");
        const webColumns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'service_web_pages'
            ORDER BY column_name;
        `;
        console.table(webColumns);

        console.log("\nTesting prisma.service.findFirst({ select: { id: true } })...");
        const serviceIdOnly = await prisma.service.findFirst({
            select: { id: true }
        });
        console.log("Success! Service id found:", serviceIdOnly?.id);

        console.log("\nTesting prisma.service.findFirst()...");
        const service = await prisma.service.findFirst({
            include: { webPage: true }
        });
        console.log("Success! Service found:", service?.name);
    } catch (e) {
        console.error("Error checking columns:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
