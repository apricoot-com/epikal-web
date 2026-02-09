const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || "postgresql://epikal:epikal@127.0.0.1:5433/epikal?sslmode=disable",
    });

    try {
        await client.connect();

        console.log("--- ENUMS ---");
        const enums = await client.query(`
            SELECT t.typname as enum_name, e.enumlabel as enum_value
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid
            ORDER BY t.typname, e.enumsortorder;
        `);
        console.table(enums.rows);

        console.log("--- SERVICES COLUMNS ---");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'services'
            ORDER BY column_name;
        `);
        console.table(res.rows);

        console.log("--- TEST SELECT * FROM services ---");
        const res3 = await client.query('SELECT * FROM services LIMIT 1');
        console.table(res3.rows);

        console.log("--- SERVICE_WEB_PAGES COLUMNS ---");
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'service_web_pages'
            ORDER BY column_name;
        `);
        console.table(res2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
