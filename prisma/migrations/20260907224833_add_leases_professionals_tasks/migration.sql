-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'RENEWED', 'EXPIRED', 'VACATED');

-- CreateEnum
CREATE TYPE "ProfessionalRole" AS ENUM ('CPA', 'LAWYER', 'PROPERTY_INSPECTOR', 'PROPERTY_MANAGER', 'POLICE_VERIFICATION_AGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('LEASE_DRAFTING', 'LEASE_SIGNING', 'TENANT_POLICE_VERIFICATION', 'PROPERTY_INSPECTION', 'RENT_COLLECTION', 'TDS_FILING', 'INDIA_TAX_FILING', 'US_TAX_FILING', 'PROPERTY_TAX_PAYMENT', 'MAINTENANCE_PAYMENT', 'LEASE_RENEWAL_DECISION', 'VACATE_NOTICE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');

-- CreateTable
CREATE TABLE "professionals" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ProfessionalRole" NOT NULL,
    "contact" TEXT,
    "licenseNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "prospectId" TEXT,
    "tenantName" TEXT NOT NULL,
    "tenantContact" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentInInr" INTEGER NOT NULL,
    "depositInInr" INTEGER NOT NULL,
    "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "title" TEXT,
    "recurrence" "TaskRecurrence" NOT NULL DEFAULT 'ONE_TIME',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "assignedProfessionalId" TEXT,
    "completedDate" TIMESTAMP(3),
    "completedByName" TEXT,
    "proofDocumentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedProfessionalId_fkey" FOREIGN KEY ("assignedProfessionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
