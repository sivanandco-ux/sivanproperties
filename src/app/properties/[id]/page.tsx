import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import { addProspect, advanceStage } from "./actions";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  INQUIRY: "Inquiry",
  VIEWING_SCHEDULED: "Viewing Scheduled",
  VIEWED: "Viewed",
  DISCUSSION: "Discussion",
  BACKGROUND_CHECK: "Background Check",
  OUTCOME_RENTED: "Rented",
  OUTCOME_SOLD: "Sold",
  OUTCOME_DROPPED: "Dropped",
};

const STAGE_OPTIONS = Object.keys(STAGE_LABELS);

export default async function PropertyManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      prospects: {
        orderBy: { createdAt: "desc" },
        include: {
          events: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      leases: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!property) notFound();
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && property.ownerId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">
          You&apos;re not authorized to manage this property.
        </p>
      </div>
    );
  }

  const addProspectWithId = addProspect.bind(null, property.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          &larr; Back to listings
        </Link>

        <h1 className="text-2xl font-semibold mt-2">{property.title}</h1>
        <p className="text-zinc-500 mb-8">
          {property.addressLine ? `${property.addressLine}, ` : ""}
          {property.city} &middot;{" "}
          <Link
            href={`/listings/${property.id}`}
            className="underline hover:no-underline"
          >
            View public listing
          </Link>
        </p>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Leases ({property.leases.length})</h2>
          <Link
            href={`/properties/${property.id}/leases/new`}
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            + New lease
          </Link>
        </div>
        {property.leases.length === 0 ? (
          <p className="text-zinc-500 mb-8">No leases yet.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-8">
            {property.leases.map((lease) => (
              <Link
                key={lease.id}
                href={`/properties/${property.id}/leases/${lease.id}`}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:shadow-sm transition-shadow flex items-center justify-between"
              >
                <span className="font-medium">{lease.tenantName}</span>
                <span className="text-xs text-zinc-500">
                  {lease.startDate.toISOString().slice(0, 10)} &rarr;{" "}
                  {lease.endDate.toISOString().slice(0, 10)} &middot; {lease.status}
                </span>
              </Link>
            ))}
          </div>
        )}

        <h2 className="font-semibold mb-3">
          Prospects ({property.prospects.length})
        </h2>

        {property.prospects.length === 0 ? (
          <p className="text-zinc-500 mb-8">No one has inquired yet.</p>
        ) : (
          <div className="flex flex-col gap-4 mb-8">
            {property.prospects.map((prospect) => {
              const currentStage = prospect.events[0]?.stage ?? "INQUIRY";
              const advanceStageWithIds = advanceStage.bind(
                null,
                property.id,
                prospect.id
              );
              return (
                <div
                  key={prospect.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-medium">{prospect.name}</p>
                      <p className="text-sm text-zinc-500">{prospect.contact}</p>
                      {prospect.notes && (
                        <p className="text-sm text-zinc-500 mt-1">
                          {prospect.notes}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-xs">
                      {STAGE_LABELS[currentStage]}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">
                    Source: {prospect.source === "PUBLIC_FORM" ? "Public listing" : "Manually added"}
                  </p>

                  <form
                    action={advanceStageWithIds}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <select
                      name="stage"
                      defaultValue={currentStage}
                      className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
                    >
                      {STAGE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <input
                      name="notes"
                      placeholder="Optional note"
                      className="flex-1 min-w-[140px] rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
                    >
                      Update
                    </button>
                    <Link
                      href={`/properties/${property.id}/leases/new?prospectId=${prospect.id}`}
                      className="text-sm underline hover:no-underline"
                    >
                      Create lease
                    </Link>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 max-w-md">
          <h2 className="font-semibold mb-4">Add a prospect manually</h2>
          <form action={addProspectWithId} className="flex flex-col gap-3">
            <input
              name="name"
              required
              placeholder="Name"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <input
              name="contact"
              required
              placeholder="Phone or email"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <textarea
              name="notes"
              rows={2}
              placeholder="Optional note"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
