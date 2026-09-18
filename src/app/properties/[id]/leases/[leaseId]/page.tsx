import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import { TASK_TYPE_LABELS, TENANT_VISIBLE_TASK_TYPES } from "@/lib/propertyStage";
import {
  completeTask,
  assignProfessionalToTask,
  confirmPaymentAsTenant,
  createMaintenanceRequest,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; leaseId: string }>;
}) {
  const { id, leaseId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      property: {
        include: {
          professionalAssignments: { include: { professional: true } },
        },
      },
      tasks: { orderBy: { dueDate: "asc" }, include: { assignedProfessional: true } },
    },
  });

  if (!lease || lease.propertyId !== id) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = lease.property.ownerId === session.user.id;
  const isContributor =
    session.user.role === "CONTRIBUTOR" &&
    lease.property.professionalAssignments.some(
      (a) => a.professionalId === session.user.professionalId
    );

  const isTenant =
    session.user.role === "TENANT" && lease.tenantEmail === session.user.email;

  if (!isAdmin && !isOwner && !isContributor && !isTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">You&apos;re not authorized for this lease.</p>
      </div>
    );
  }

  const canReassign = isAdmin || isOwner;
  const myProfessionalId = session.user.professionalId;

  const visibleTasks = isTenant
    ? lease.tasks.filter((t) =>
        (TENANT_VISIBLE_TASK_TYPES as readonly string[]).includes(t.type)
      )
    : lease.tasks;

  const now = new Date();
  const overdue = visibleTasks.filter((t) => t.status !== "COMPLETED" && t.dueDate < now);
  const pending = visibleTasks.filter((t) => t.status !== "COMPLETED" && t.dueDate >= now);
  const completed = visibleTasks.filter((t) => t.status === "COMPLETED");

  const assignedProfessionals = lease.property.professionalAssignments.map(
    (a) => a.professional
  );

  function TaskRow({ task }: { task: NonNullable<typeof lease>["tasks"][number] }) {
    const completeWithIds = completeTask.bind(null, id, leaseId, task.id);
    const assignWithIds = assignProfessionalToTask.bind(null, id, leaseId, task.id);
    const confirmPaymentWithIds = confirmPaymentAsTenant.bind(null, id, leaseId, task.id);
    const isOverdue = task.status !== "COMPLETED" && task.dueDate < now;
    const canComplete =
      isAdmin || isOwner || task.assignedProfessionalId === myProfessionalId;
    const canConfirmPayment =
      isTenant && task.type === "RENT_COLLECTION" && !task.tenantConfirmedDate;

    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <p className="font-medium">
              {TASK_TYPE_LABELS[task.type] ?? task.type}
              {task.title ? ` — ${task.title}` : ""}
            </p>
            <p className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>
              Due {task.dueDate.toISOString().slice(0, 10)}
              {isOverdue ? " (overdue)" : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-xs">
            {task.status}
          </span>
        </div>

        {task.notes && <p className="text-sm text-zinc-500 mt-1">{task.notes}</p>}

        {task.assignedProfessional && (
          <p className="text-xs text-zinc-400 mt-1">
            Assigned to {task.assignedProfessional.name}
          </p>
        )}

        {task.tenantConfirmedDate && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Tenant confirmed paid on {task.tenantConfirmedDate.toISOString().slice(0, 10)}
          </p>
        )}

        {task.status === "COMPLETED" ? (
          <p className="text-xs text-zinc-400 mt-2">
            Completed {task.completedDate?.toISOString().slice(0, 10)} by{" "}
            {task.completedByName}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {canReassign && (
              <form action={assignWithIds} className="flex items-center gap-2">
                <select
                  name="professionalId"
                  defaultValue={task.assignedProfessionalId || ""}
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
                >
                  <option value="">Unassigned</option>
                  {assignedProfessionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Assign
                </button>
              </form>
            )}

            {canComplete && (
              <form action={completeWithIds} className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-foreground text-background px-3 py-1 text-xs font-medium hover:bg-[#383838] dark:hover:bg-[#ccc]"
                >
                  Mark complete
                </button>
              </form>
            )}

            {canConfirmPayment && (
              <form action={confirmPaymentWithIds} className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-full border border-emerald-600 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950"
                >
                  I paid this
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <Link href={`/properties/${id}`} className="text-sm text-zinc-500 hover:underline">
            &larr; {lease.property.title}
          </Link>

          <h1 className="text-xl font-semibold mt-2 mb-1">Lease: {lease.tenantName}</h1>
          <p className="text-sm text-zinc-500 mb-6">
            {lease.startDate.toISOString().slice(0, 10)} &rarr;{" "}
            {lease.endDate.toISOString().slice(0, 10)} &middot; &#8377;
            {lease.rentInInr.toLocaleString("en-IN")}/mo &middot; Deposit &#8377;
            {lease.depositInInr.toLocaleString("en-IN")} &middot; {lease.status}
          </p>

          {isTenant && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 mb-6 max-w-md">
              <h2 className="font-semibold mb-3">Report an issue</h2>
              <form
                action={createMaintenanceRequest.bind(null, id, leaseId)}
                className="flex flex-col gap-2"
              >
                <input
                  name="title"
                  required
                  placeholder="What's wrong? (e.g. Leaking kitchen tap)"
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                />
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Any more details (optional)"
                  className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="self-start rounded-full bg-foreground text-background px-4 py-1.5 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc]"
                >
                  Submit request
                </button>
              </form>
            </div>
          )}

          {overdue.length > 0 && (
            <section className="mb-6">
              <h2 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                Overdue ({overdue.length})
              </h2>
              <div className="flex flex-col gap-3">
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-6">
            <h2 className="font-semibold mb-2">Upcoming ({pending.length})</h2>
            <div className="flex flex-col gap-3">
              {pending.length === 0 ? (
                <p className="text-sm text-zinc-500">Nothing pending.</p>
              ) : (
                pending.map((t) => <TaskRow key={t.id} task={t} />)
              )}
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Completed ({completed.length})</h2>
            <div className="flex flex-col gap-3">
              {completed.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
