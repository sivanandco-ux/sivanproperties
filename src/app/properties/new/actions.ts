"use server";

import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createProperty(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const listingType = String(formData.get("listingType") || "RENT") as "RENT" | "SALE";
  const addressLine = String(formData.get("addressLine") || "").trim();
  const city = String(formData.get("city") || "Chennai").trim();
  const state = String(formData.get("state") || "Tamil Nadu").trim();
  const pincode = String(formData.get("pincode") || "").trim() || null;
  const priceRaw = String(formData.get("priceInInr") || "").trim();
  const priceInInr = priceRaw ? Number(priceRaw) : null;

  if (!title || !description || !addressLine) {
    throw new Error("Title, description, and address are required.");
  }

  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const property = await prisma.property.create({
    data: {
      ownerId: session.user.id,
      title,
      description,
      listingType,
      addressLine,
      city,
      state,
      pincode,
      priceInInr,
    },
  });

  for (const file of photoFiles) {
    const blob = await put(`properties/${property.id}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    await prisma.photo.create({
      data: { propertyId: property.id, url: blob.url },
    });
  }

  redirect(`/properties/${property.id}`);
}
