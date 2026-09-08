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

async function isAssignedContributor(propertyId: string, professionalId?: string) {
  if (!professionalId) return false;
  const assignment = await prisma.propertyProfessional.findUnique({
    where: { propertyId_professionalId: { propertyId, professionalId } },
  });
  return Boolean(assignment);
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

export async function assignProfessional(propertyId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access only.");
  }

  const professionalId = String(formData.get("professionalId") || "").trim();
  if (!professionalId) throw new Error("Choose a professional to assign.");

  await prisma.propertyProfessional.upsert({
    where: { propertyId_professionalId: { propertyId, professionalId } },
    update: {},
    create: { propertyId, professionalId, assignedByUserId: session.user.id },
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function unassignProfessional(propertyId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access only.");
  }

  const professionalId = String(formData.get("professionalId") || "").trim();

  await prisma.propertyProfessional.delete({
    where: { propertyId_professionalId: { propertyId, professionalId } },
  });

  revalidatePath(`/properties/${propertyId}`);
}

export async function addNote(propertyId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated.");

  const isAdmin = session.user.role === "ADMIN";
  const isContributor =
    session.user.role === "CONTRIBUTOR" &&
    (await isAssignedContributor(propertyId, session.user.professionalId));

  if (!isAdmin && !isContributor) {
    throw new Error("Only Admin or an assigned contributor can add team notes.");
  }

  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("Note can't be empty.");

  await prisma.note.create({
    data: { propertyId, authorId: session.user.id, body },
  });

  revalidatePath(`/properties/${propertyId}`);
}
