// Usage: node scripts/add-tester.mjs someone@example.com "optional note"
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";

const [, , email, note] = process.argv;

if (!email) {
  console.error("Usage: node scripts/add-tester.mjs <email> [note]");
  process.exit(1);
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const tester = await prisma.allowedTester.upsert({
    where: { email },
    update: { note },
    create: { email, note },
  });

  console.log("Added/updated allowed tester:", tester);
  await prisma.$disconnect();
}

main();
