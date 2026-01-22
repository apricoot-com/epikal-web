import { prisma } from './src/server/db/client'; async function main() { const c = await prisma.company.findFirst(); console.log(c?.id); } main();
