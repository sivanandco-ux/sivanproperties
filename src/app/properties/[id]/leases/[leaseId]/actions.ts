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

  if (!isAdmin && !isOwner && !isContributor) {
    throw new Error("Not authorized for this lease.");
  }
  return { session, lease, isAdmin, isOwner, isContributor };
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
