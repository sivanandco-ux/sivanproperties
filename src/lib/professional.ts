import type { ProfessionalRole } from "@/generated/prisma/client";

export const PROFESSIONAL_ROLES: ProfessionalRole[] = [
  "AGENT",
  "CPA",
  "LAWYER",
  "PROPERTY_INSPECTOR",
  "PROPERTY_MANAGER",
  "MAINTENANCE_TEAM",
  "POLICE_VERIFICATION_AGENT",
  "OTHER",
];

export const PROFESSIONAL_ROLE_LABELS: Record<ProfessionalRole, string> = {
  AGENT: "Agent",
  CPA: "CPA",
  LAWYER: "Lawyer",
  PROPERTY_INSPECTOR: "Property Inspector",
  PROPERTY_MANAGER: "Property Manager",
  MAINTENANCE_TEAM: "Maintenance Team",
  POLICE_VERIFICATION_AGENT: "Police Verification Agent",
  OTHER: "Other",
};
