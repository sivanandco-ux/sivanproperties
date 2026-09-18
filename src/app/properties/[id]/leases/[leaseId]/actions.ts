"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireLeaseAccess(propertyId: string, leaseId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated.");

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      property: { include: { professionalAssignments: true } },
    },
  });
  if (!lease || lease.propertyId !== propertyId) throw new Error("Lease not found.");

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = lease.property.ownerId === session.user.id;
  const isContributor =
    session.user.role === "CONTRIBUTOR" &&
    lease.property.professionalAssignments.some(
      (a) => a.professionalId === session.user.professionalId
    );
  const isTenant =
    session.user.role === "TENANT" && lease.tenantEmail === session.user.email;

  if (!isAdmin && !isOwner && !isContributor && !isTenant) {
    throw new Error("Not authorized for this lease.");
  }
  return { session, lease, isAdmin, isOwner, isContributor, isTenant };
}

export async function completeTask(
  propertyId: string,
  leaseId: string,
  taskId: string,
  formData: FormData
) {
  const { session, isAdmin, isOwner } = await requireLeaseAccess(propertyId, leaseId);

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

  const canComplete =
    isAdmin || isOwner || task.assignedProfessionalId === session.user.professionalId;
  if (!canComplete) {
    throw new Error("You can only complete tasks assigned to you.");
  }

  const proofDocumentUrl = String(formData.get("proofDocumentUrl") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedDate: new Date(),
      completedByName: session.user.name || session.user.email || "Unknown",
      proofDocumentUrl,
      notes,
    },
  });

  revalidatePath(`/properties/${propertyId}/leases/${leaseId}`);
  revalidatePath(`/admin`);
}

export async function assignProfessionalToTask(
  propertyId: string,
  leaseId: string,
  taskId: string,
  formData: FormData
) {
  const { isAdmin, isOwner } = await requireLeaseAccess(propertyId, leaseId);
  if (!isAdmin && !isOwner) {
    throw new Error("Only Admin or the landlord can reassign tasks.");
  }

  const professionalId = String(formData.get("professionalId") || "").trim() || null;

  await prisma.task.update({
    where: { id: taskId },
    data: { assignedProfessionalId: professionalId },
  });

  revalidatePath(`/properties/${propertyId}/leases/${leaseId}`);
}

export async function confirmPaymentAsTenant(
  propertyId: string,
  leaseId: string,
  taskId: string
) {
  const { isTenant, lease } = await requireLeaseAccess(propertyId, leaseId);
  if (!isTenant) throw new Error("Only the tenant on this lease can confirm payment.");

  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (task.leaseId !== lease.id || task.type !== "RENT_COLLECTION") {
    throw new Error("Can only confirm rent collection tasks.");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { tenantConfirmedDate: new Date() },
  });

  revalidatePath(`/properties/${propertyId}/leases/${leaseId}`);
}

export async function createMaintenanceRequest(
  propertyId: string,
  leaseId: string,
  formData: FormData
) {
  const { isTenant, lease } = await requireLeaseAccess(propertyId, leaseId);
  if (!isTenant) throw new Error("Only the tenant on this lease can report an issue.");

  const title = String(formData.get("title") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!title) throw new Error("Please describe the issue.");

  await prisma.task.create({
    data: {
      leaseId: lease.id,
      type: "MAINTENANCE_REQUEST",
      title,
      notes,
      recurrence: "ONE_TIME",
      status: "PENDING",
      dueDate: new Date(),
    },
  });

  revalidatePath(`/properties/${propertyId}/leases/${leaseId}`);
}
