"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProfessionalRole } from "@/generated/prisma/client";
import { PROFESSIONAL_ROLES } from "@/lib/professional";

export async function createProfessional(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Admin access only.");
  }

  const name = String(formData.get("name") || "").trim();
  const roleRaw = String(formData.get("role") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const contact = String(formData.get("contact") || "").trim() || null;
  const licenseNumber = String(formData.get("licenseNumber") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name || !email || !PROFESSIONAL_ROLES.includes(roleRaw as ProfessionalRole)) {
    throw new Error("Name, a valid role, and email are required.");
  }
  const role = roleRaw as ProfessionalRole;

  await prisma.professional.create({
    data: {
      name,
      role,
      email,
      contact,
      licenseNumber,
      notes,
    },
  });

  redirect("/admin/professionals");
}
