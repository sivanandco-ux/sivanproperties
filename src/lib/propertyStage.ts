import { PRE_MOVE_IN_TASK_TYPES } from "@/lib/tasks";
import type { Prisma } from "@/generated/prisma/client";

export type PropertyStageValue =
  | "LISTED"
  | "PROSPECTING"
  | "LEASE_SIGNED"
  | "MOVED_IN"
  | "COMPLIANT";

export const STAGE_ORDER: PropertyStageValue[] = [
  "LISTED",
  "PROSPECTING",
  "LEASE_SIGNED",
  "MOVED_IN",
  "COMPLIANT",
];

export const STAGE_LABELS: Record<PropertyStageValue, string> = {
  LISTED: "Listed",
  PROSPECTING: "Prospecting",
  LEASE_SIGNED: "Lease Signed",
  MOVED_IN: "Moved In",
  COMPLIANT: "Compliant",
};

const PROSPECTING_STAGES = new Set([
  "VIEWING_SCHEDULED",
  "VIEWED",
  "DISCUSSION",
  "BACKGROUND_CHECK",
]);

type PropertyForStage = Prisma.PropertyGetPayload<{
  include: {
    prospects: { include: { events: true } };
    leases: { include: { tasks: true } };
  };
}>;

export type PropertyStageResult = {
  stage: PropertyStageValue;
  /** What's still outstanding to reach the next stage, if anything. */
  blockingItems: string[];
};

export function computePropertyStage(property: PropertyForStage): PropertyStageResult {
  const now = new Date();

  const lease = [...property.leases].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];

  if (!lease) {
    const hasProspectingActivity = property.prospects.some((p) =>
      p.events.some((e) => PROSPECTING_STAGES.has(e.stage))
    );
    return {
      stage: hasProspectingActivity ? "PROSPECTING" : "LISTED",
      blockingItems: hasProspectingActivity
        ? []
        : ["No prospects have inquired yet"],
    };
  }

  const preMoveInTasks = lease.tasks.filter((t) =>
    PRE_MOVE_IN_TASK_TYPES.includes(t.type)
  );
  const incompletePreMoveIn = preMoveInTasks.filter((t) => t.status !== "COMPLETED");
  const startDatePassed = now >= lease.startDate;

  if (!startDatePassed || incompletePreMoveIn.length > 0) {
    const blockingItems = [
      ...(!startDatePassed ? ["Lease start date hasn't arrived yet"] : []),
      ...incompletePreMoveIn.map((t) => TASK_TYPE_LABELS[t.type] ?? t.type),
    ];
    return { stage: "LEASE_SIGNED", blockingItems };
  }

  const overdueTasks = lease.tasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate < now
  );

  if (overdueTasks.length > 0) {
    return {
      stage: "MOVED_IN",
      blockingItems: overdueTasks.map(
        (t) => `${TASK_TYPE_LABELS[t.type] ?? t.type} (overdue)`
      ),
    };
  }

  return { stage: "COMPLIANT", blockingItems: [] };
}

const TASK_TYPE_LABELS: Record<string, string> = {
  LEASE_DRAFTING: "Lease drafting",
  LEASE_SIGNING: "Lease signing",
  TENANT_POLICE_VERIFICATION: "Tenant police verification",
  ADVANCE_PAYMENT: "Advance payment",
  DEPOSIT_PAYMENT: "Deposit payment",
  KEY_HANDOVER: "Key handover",
  PROPERTY_INSPECTION: "Property inspection",
  RENT_COLLECTION: "Rent collection",
  TDS_FILING: "TDS filing",
  INDIA_TAX_FILING: "India tax filing",
  US_TAX_FILING: "US tax filing",
  PROPERTY_TAX_PAYMENT: "Property tax payment",
  MAINTENANCE_PAYMENT: "Maintenance payment",
  LEASE_RENEWAL_DECISION: "Lease renewal decision",
  VACATE_NOTICE: "Vacate notice",
  OTHER: "Other",
};
