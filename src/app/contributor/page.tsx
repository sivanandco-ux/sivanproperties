import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import { PROFESSIONAL_ROLE_LABELS } from "@/lib/professional";

export const dynamic = "force-dynamic";

export default async function ContributorHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CONTRIBUTOR" || !session.user.professionalId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">This page is for assigned contributors only.</p>
      </div>
    );
  }

  const professional = await prisma.professional.findUnique({
    where: { id: session.user.professionalId },
    include: {
      assignments: {
        include: {
          property: { include: { photos: { take: 1 } } },
        },
      },
      tasks: {
        where: { status: { not: "COMPLETED" } },
        include: { lease: { include: { property: true } } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!professional) {
    throw new Error("Professional record not found for this contributor.");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold mb-1">
            Welcome, {professional.name}
          </h1>
          <p className="text-sm text-zinc-500 mb-8">
            {PROFESSIONAL_ROLE_LABELS[professional.role]}
          </p>

          <h2 className="font-semibold mb-3">
            Your assigned properties ({professional.assignments.length})
          </h2>
          <div className="flex flex-col gap-2 mb-8">
            {professional.assignments.length === 0 ? (
              <p className="text-zinc-500">No properties assigned to you yet.</p>
            ) : (
              professional.assignments.map((a) => (
                <Link
                  key={a.id}
                  href={`/properties/${a.property.id}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:shadow-sm transition-shadow bg-white dark:bg-zinc-950"
                >
                  <div className="h-12 w-12 shrink-0 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-zinc-400 text-[10px]">
                    {a.property.photos[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.property.photos[0].url}
                        alt={a.property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "No photo"
                    )}
                  </div>
                  <span className="font-medium">{a.property.title}</span>
                </Link>
              ))
            )}
          </div>

          <h2 className="font-semibold mb-3">
            Your open tasks ({professional.tasks.length})
          </h2>
          <div className="flex flex-col gap-2">
            {professional.tasks.length === 0 ? (
              <p className="text-zinc-500">Nothing outstanding.</p>
            ) : (
              professional.tasks.map((t) => {
                const isOverdue = t.status !== "COMPLETED" && t.dueDate < new Date();
                return (
                  <Link
                    key={t.id}
                    href={`/properties/${t.lease.property.id}/leases/${t.leaseId}`}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:shadow-sm transition-shadow flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{t.type.replaceAll("_", " ")}</p>
                      <p className="text-xs text-zinc-500">{t.lease.property.title}</p>
                    </div>
                    <span
                      className={`text-xs shrink-0 ${
                        isOverdue ? "text-red-600 dark:text-red-400" : "text-zinc-500"
                      }`}
                    >
                      Due {t.dueDate.toISOString().slice(0, 10)}
                      {isOverdue ? " (overdue)" : ""}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
