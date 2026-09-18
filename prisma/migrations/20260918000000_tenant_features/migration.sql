-- AlterEnum
ALTER TYPE "TaskType" ADD VALUE 'MAINTENANCE_REQUEST';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "tenantConfirmedDate" TIMESTAMP(3);
