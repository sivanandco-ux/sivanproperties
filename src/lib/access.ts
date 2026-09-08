import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/client";

export type ResolvedAccess =
  | { allowed: false }
  | { allowed: true; role: Role; professionalId?: string };

/**
 * Computes what role (if any) an email is currently allowed to sign in as.
 * Recomputed on every sign-in and every session read (see auth.ts) rather
 * than trusting a stored value, so access changes (a lease ending, a tester
 * being removed) take effect immediately without leaving someone with stale
 * access from whenever they first logged in.
 *
 * Priority: tester allowlist (Admin/Landlord) > tenant on an active lease >
 * assigned professional/contributor.
 */
export async function resolveAccess(email: string): Promise<ResolvedAccess> {
  const tester = await prisma.allowedTester.findUnique({ where: { email } });
  if (tester) {
    return { allowed: true, role: tester.role };
  }

  const lease = await prisma.lease.findFirst({ where: { tenantEmail: email } });
  if (lease) {
    return { allowed: true, role: "TENANT" };
  }

  const professional = await prisma.professional.findUnique({ where: { email } });
  if (professional) {
    return { allowed: true, role: "CONTRIBUTOR", professionalId: professional.id };
  }

  return { allowed: false };
}
