import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import { computePropertyStage, type PropertyStageValue } from "@/lib/propertyStage";
import PropertyStageBar from "@/components/PropertyStageBar";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">Admin access only.</p>
      </div>
    );
  }

  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      photos: { take: 1 },
      prospects: { include: { events: true } },
      leases: { include: { tasks: true } },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-semibold mb-1">Admin</h1>
        <p className="text-sm text-zinc-500 mb-6">
          {properties.length} propert{properties.length === 1 ? "y" : "ies"} across all landlords
        </p>

        <div className="flex flex-col gap-3">
          {properties.map((property) => {
            const { stage, blockingItems } = computePropertyStage(property);
            const latestLease = [...property.leases].sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            )[0];
            const leaseHref = latestLease
              ? `/properties/${property.id}/leases/${latestLease.id}`
              : `/properties/${property.id}/leases/new`;
            const hrefs: Partial<Record<PropertyStageValue, string>> = {
              LISTED: `/properties/${property.id}`,
              PROSPECTING: `/properties/${property.id}`,
              LEASE_SIGNED: leaseHref,
              ...(latestLease ? { MOVED_IN: leaseHref, COMPLIANT: leaseHref } : {}),
            };

            return (
              <div
                key={property.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:shadow-md transition-shadow bg-white dark:bg-zinc-950"
              >
                <Link href={`/properties/${property.id}`} className="shrink-0">
                  <div className="h-16 w-16 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 text-[10px]">
                    {property.photos[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={property.photos[0].url}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "No photo"
                    )}
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <Link
                      href={`/properties/${property.id}`}
                      className="font-medium truncate hover:underline"
                    >
                      {property.title}
                    </Link>
                    <p className="text-xs text-zinc-400 shrink-0">
                      {property.owner.name || property.owner.email}
                    </p>
                  </div>
                  <PropertyStageBar stage={stage} hrefs={hrefs} />
                  {blockingItems.length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 truncate">
                      Needs: {blockingItems.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {properties.length === 0 && (
            <p className="text-zinc-500">No properties yet.</p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
