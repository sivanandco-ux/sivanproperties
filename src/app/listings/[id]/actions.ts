"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function submitInterest(propertyId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const message = String(formData.get("message") || "").trim() || null;

  if (!name || !contact) {
    throw new Error("Name and contact are required.");
  }

  await prisma.prospect.create({
    data: {
      propertyId,
      name,
      contact,
      notes: message,
      source: "PUBLIC_FORM",
    },
  });

  revalidatePath(`/listings/${propertyId}`);
}
