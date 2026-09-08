// Usage: npx tsx scripts/add-tester.ts <email> <ADMIN|LANDLORD> [note]
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const [, , email, roleArg, note] = process.argv;
const role = (roleArg || "LANDLORD").toUpperCase();

if (!email || (role !== "ADMIN" && role !== "LANDLORD")) {
  console.error("Usage: npx tsx scripts/add-tester.ts <email> <ADMIN|LANDLORD> [note]");
  process.exit(1);
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const tester = await prisma.allowedTester.upsert({
    where: { email },
    update: { role, note },
    create: { email, role, note },
  });

  console.log("Added/updated allowed tester:", tester);
  await prisma.$disconnect();
}

main();
