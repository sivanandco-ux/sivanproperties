"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireLeaseAccess(propertyId: string, leaseId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated.");

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: { property: true },
  });
  if (!lease || lease.propertyId !== propertyId) throw new Error("Lease not found.");

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && lease.property.ownerId !== session.user.id) {
    throw new Error("Not authorized for this lease.");
  }
  return { session, lease };
}

export async function completeTask(
  propertyId: string,
  leaseId: string,
  taskId: string,
  formData: FormData
) {
  const { session } = await requireLeaseAccess(propertyId, leaseId);

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
  await requireLeaseAccess(propertyId, leaseId);

  const professionalId = String(formData.get("professionalId") || "").trim() || null;

  await prisma.task.update({
    where: { id: taskId },
    data: { assignedProfessionalId: professionalId },
  });

  revalidatePath(`/properties/${propertyId}/leases/${leaseId}`);
}
