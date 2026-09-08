"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireOwner(propertyId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated.");

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  const isAdmin = session.user.role === "ADMIN";
  if (!property || (!isAdmin && property.ownerId !== session.user.id)) {
    throw new Error("Not authorized for this property.");
  }
  return { session, property };
}

export async function addProspect(propertyId: string, formData: FormData) {
  await requireOwner(propertyId);

  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name || !contact) {
    throw new Error("Name and contact are required.");
  }

  await prisma.prospect.create({
    data: { propertyId, name, contact, notes, source: "MANUAL" },
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function advanceStage(
  propertyId: string,
  prospectId: string,
  formData: FormData
) {
  const { session } = await requireOwner(propertyId);

  const stage = String(formData.get("stage") || "") as
    | "INQUIRY"
    | "VIEWING_SCHEDULED"
    | "VIEWED"
    | "DISCUSSION"
    | "BACKGROUND_CHECK"
    | "OUTCOME_RENTED"
    | "OUTCOME_SOLD"
    | "OUTCOME_DROPPED";
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!stage) throw new Error("Stage is required.");

  await prisma.pipelineEvent.create({
    data: { prospectId, stage, notes, authorId: session.user.id },
  });

  revalidatePath(`/properties/${propertyId}`);
}
