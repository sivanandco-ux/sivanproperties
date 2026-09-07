"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Photos are uploaded client-side directly to Vercel Blob (see
// NewPropertyForm.tsx) before this action ever runs -- Vercel's serverless
// functions reject request bodies over ~4.5MB at the platform level,
// regardless of Next's own configurable serverActions.bodySizeLimit, so raw
// photo files can never be sent through this action's FormData.
function isOwnBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function createProperty(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const listingType = String(formData.get("listingType") || "RENT") as "RENT" | "SALE";
  const addressLine = String(formData.get("addressLine") || "").trim() || null;
  const city = String(formData.get("city") || "Chennai").trim();
  const state = String(formData.get("state") || "Tamil Nadu").trim();
  const pincode = String(formData.get("pincode") || "").trim() || null;
  const priceRaw = String(formData.get("priceInInr") || "").trim();
  const priceInInr = priceRaw ? Number(priceRaw) : null;

  if (!title || !description) {
    throw new Error("Title and description are required.");
  }

  const photoUrls = formData
    .getAll("photoUrls")
    .map((v) => String(v))
    .filter(isOwnBlobUrl);

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
      photos: {
        create: photoUrls.map((url) => ({ url })),
      },
    },
  });

  redirect(`/properties/${property.id}`);
}
