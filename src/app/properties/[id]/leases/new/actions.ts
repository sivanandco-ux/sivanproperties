"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLeaseWithDefaultTasks } from "@/lib/leases";

async function requirePropertyAccess(propertyId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated.");

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  const isAdmin = session.user.role === "ADMIN";
  if (!property || (!isAdmin && property.ownerId !== session.user.id)) {
    throw new Error("Not authorized for this property.");
  }
  return property;
}

export async function createLease(propertyId: string, formData: FormData) {
  await requirePropertyAccess(propertyId);

  const prospectId = String(formData.get("prospectId") || "").trim() || undefined;
  const tenantName = String(formData.get("tenantName") || "").trim();
  const tenantContact = String(formData.get("tenantContact") || "").trim();
  const tenantEmail = String(formData.get("tenantEmail") || "").trim();
  const startDateRaw = String(formData.get("startDate") || "");
  const endDateRaw = String(formData.get("endDate") || "");
  const rentInInr = Number(formData.get("rentInInr") || 0);
  const depositInInr = Number(formData.get("depositInInr") || 0);

  if (!tenantName || !tenantContact || !tenantEmail || !startDateRaw || !endDateRaw) {
    throw new Error("Tenant name, contact, email, and lease dates are required.");
  }

  const lease = await createLeaseWithDefaultTasks({
    propertyId,
    prospectId,
    tenantName,
    tenantContact,
    tenantEmail,
    startDate: new Date(startDateRaw),
    endDate: new Date(endDateRaw),
    rentInInr,
    depositInInr,
  });

  redirect(`/properties/${propertyId}/leases/${lease.id}`);
}
