import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function TenantHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TENANT" || !session.user.email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">This page is for tenants only.</p>
      </div>
    );
  }

  const leases = await prisma.lease.findMany({
    where: { tenantEmail: session.user.email },
    orderBy: { createdAt: "desc" },
    include: { property: { include: { photos: { take: 1 } } } },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold mb-1">Your lease{leases.length === 1 ? "" : "s"}</h1>
          <p className="text-sm text-zinc-500 mb-8">
            View your lease, confirm rent payments, and report issues.
          </p>

          {leases.length === 0 ? (
            <p className="text-zinc-500">No lease found for your account yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {leases.map((lease) => (
                <Link
                  key={lease.id}
                  href={`/properties/${lease.propertyId}/leases/${lease.id}`}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:shadow-sm transition-shadow bg-white dark:bg-zinc-950"
                >
                  <div className="h-16 w-16 shrink-0 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 text-[10px]">
                    {lease.property.photos[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lease.property.photos[0].url}
                        alt={lease.property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "No photo"
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{lease.property.title}</p>
                    <p className="text-xs text-zinc-500">
                      {lease.startDate.toISOString().slice(0, 10)} &rarr;{" "}
                      {lease.endDate.toISOString().slice(0, 10)} &middot; &#8377;
                      {lease.rentInInr.toLocaleString("en-IN")}/mo &middot; {lease.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
