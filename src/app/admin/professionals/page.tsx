import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import { PROFESSIONAL_ROLE_LABELS } from "@/lib/professional";

export const dynamic = "force-dynamic";

export default async function ProfessionalsListPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">Admin access only.</p>
      </div>
    );
  }

  const professionals = await prisma.professional.findMany({
    orderBy: { createdAt: "desc" },
    include: { assignments: { include: { property: true } } },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Professionals</h1>
            <Link
              href="/admin/professionals/new"
              className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              + Onboard professional
            </Link>
          </div>

          {professionals.length === 0 ? (
            <p className="text-zinc-500">No professionals onboarded yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {professionals.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium">{p.name}</p>
                    <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-xs">
                      {PROFESSIONAL_ROLE_LABELS[p.role]}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">{p.email}</p>
                  {p.contact && <p className="text-sm text-zinc-500">{p.contact}</p>}
                  <p className="text-xs text-zinc-400 mt-2">
                    Assigned to{" "}
                    {p.assignments.length === 0
                      ? "no properties yet"
                      : p.assignments.map((a) => a.property.title).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
