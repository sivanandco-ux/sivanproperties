import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import { createLease } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewLeasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prospectId?: string }>;
}) {
  const { id } = await params;
  const { prospectId } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const property = await prisma.property.findUnique({
    where: { id },
    include: { prospects: { orderBy: { createdAt: "desc" } } },
  });

  if (!property) notFound();
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && property.ownerId !== session.user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">You&apos;re not authorized for this property.</p>
      </div>
    );
  }

  const prefill = prospectId
    ? property.prospects.find((p) => p.id === prospectId)
    : undefined;

  const createLeaseWithId = createLease.bind(null, property.id);

  const today = new Date();
  const defaultStart = today.toISOString().slice(0, 10);
  const defaultEnd = new Date(
    today.getFullYear(),
    today.getMonth() + 11,
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-10">
        <div className="mx-auto max-w-xl">
          <h1 className="text-xl font-semibold mb-1">Create lease</h1>
          <p className="text-sm text-zinc-500 mb-6">{property.title}</p>

          <form action={createLeaseWithId} className="flex flex-col gap-4">
            {property.prospects.length > 0 && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Link to a prospect (optional)</span>
                <select
                  name="prospectId"
                  defaultValue={prefill?.id || ""}
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                >
                  <option value="">None</option>
                  {property.prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} &mdash; {p.contact}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Tenant name</span>
              <input
                name="tenantName"
                required
                defaultValue={prefill?.name}
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Tenant contact (phone)</span>
              <input
                name="tenantContact"
                required
                defaultValue={prefill?.contact}
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Tenant email</span>
              <input
                name="tenantEmail"
                type="email"
                required
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                placeholder="This email will be able to sign in as the tenant"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Start date</span>
                <input
                  name="startDate"
                  type="date"
                  required
                  defaultValue={defaultStart}
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">End date</span>
                <input
                  name="endDate"
                  type="date"
                  required
                  defaultValue={defaultEnd}
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Rent (INR/month)</span>
                <input
                  name="rentInInr"
                  type="number"
                  min="0"
                  required
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Deposit (INR)</span>
                <input
                  name="depositInInr"
                  type="number"
                  min="0"
                  required
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Create lease
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
