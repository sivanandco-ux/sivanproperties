-- AlterEnum
ALTER TYPE "ProfessionalRole" ADD VALUE 'AGENT';
ALTER TYPE "ProfessionalRole" ADD VALUE 'MAINTENANCE_TEAM';

-- AlterEnum: OWNER -> LANDLORD, AGENT -> CONTRIBUTOR for any existing rows
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'LANDLORD', 'TENANT', 'CONTRIBUTOR');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"::text
    WHEN 'OWNER' THEN 'LANDLORD'
    WHEN 'AGENT' THEN 'CONTRIBUTOR'
    ELSE "role"::text
  END::"Role_new"
);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'LANDLORD';
COMMIT;

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_agentId_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "professionals" DROP CONSTRAINT "professionals_propertyId_fkey";

-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "tenantEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "leases" ALTER COLUMN "tenantEmail" DROP DEFAULT;

-- AlterTable
ALTER TABLE "professionals" DROP COLUMN "propertyId",
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "professionals" ALTER COLUMN "email" DROP DEFAULT;

-- AlterTable: add role column fresh, now that "Role" points at the new enum
ALTER TABLE "allowed_testers" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'LANDLORD';

-- DropTable
DROP TABLE "assignments";

-- CreateTable
CREATE TABLE "property_professionals" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_professionals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_professionals_propertyId_professionalId_key" ON "property_professionals"("propertyId", "professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_email_key" ON "professionals"("email");

-- AddForeignKey
ALTER TABLE "property_professionals" ADD CONSTRAINT "property_professionals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_professionals" ADD CONSTRAINT "property_professionals_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_professionals" ADD CONSTRAINT "property_professionals_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
