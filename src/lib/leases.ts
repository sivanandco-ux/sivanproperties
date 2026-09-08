import { prisma } from "@/lib/prisma";
import { defaultTasksForLease } from "@/lib/tasks";

export async function createLeaseWithDefaultTasks(data: {
  propertyId: string;
  prospectId?: string;
  tenantName: string;
  tenantContact: string;
  tenantEmail: string;
  startDate: Date;
  endDate: Date;
  rentInInr: number;
  depositInInr: number;
}) {
  return prisma.$transaction(async (tx) => {
    const lease = await tx.lease.create({
      data: {
        propertyId: data.propertyId,
        prospectId: data.prospectId,
        tenantName: data.tenantName,
        tenantContact: data.tenantContact,
        tenantEmail: data.tenantEmail,
        startDate: data.startDate,
        endDate: data.endDate,
        rentInInr: data.rentInInr,
        depositInInr: data.depositInInr,
      },
    });

    const tasks = defaultTasksForLease({
      startDate: data.startDate,
      endDate: data.endDate,
    });

    await tx.task.createMany({
      data: tasks.map((task) => ({
        leaseId: lease.id,
        type: task.type,
        recurrence: task.recurrence,
        dueDate: task.dueDate,
        notes: task.notes,
      })),
    });

    return lease;
  });
}
