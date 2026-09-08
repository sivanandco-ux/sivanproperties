import type { TaskType, TaskRecurrence } from "@/generated/prisma/client";

/** The checklist gating "Lease Signed" -> "Moved In" on the admin stage bar. */
export const PRE_MOVE_IN_TASK_TYPES: TaskType[] = [
  "ADVANCE_PAYMENT",
  "DEPOSIT_PAYMENT",
  "KEY_HANDOVER",
];

export type DefaultTaskSpec = {
  type: TaskType;
  recurrence: TaskRecurrence;
  dueDate: Date;
  notes?: string;
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function recurringDueDates(start: Date, end: Date, intervalMonths: number): Date[] {
  const dates: Date[] = [];
  let next = addMonths(start, intervalMonths);
  while (next <= end) {
    dates.push(next);
    next = addMonths(next, intervalMonths);
  }
  return dates;
}

const STATUTORY_DEADLINE_NOTE =
  "Estimated reminder based on lease timing — confirm the exact statutory deadline with your CPA/lawyer.";

/**
 * Generates the default set of compliance/upkeep tasks for a new lease.
 * Recurring deadlines are spaced relative to the lease's own start date
 * rather than pinned to real government due-dates (TDS quarters, property
 * tax half-years, ITR filing windows), since those shift year to year and
 * asserting a specific date here would risk being wrong about the actual
 * legal deadline.
 */
export function defaultTasksForLease(lease: {
  startDate: Date;
  endDate: Date;
}): DefaultTaskSpec[] {
  const { startDate, endDate } = lease;

  const oneTime: DefaultTaskSpec[] = [
    { type: "LEASE_DRAFTING", recurrence: "ONE_TIME", dueDate: addDays(startDate, -14) },
    { type: "LEASE_SIGNING", recurrence: "ONE_TIME", dueDate: addDays(startDate, -3) },
    {
      type: "TENANT_POLICE_VERIFICATION",
      recurrence: "ONE_TIME",
      dueDate: addDays(startDate, -3),
      notes: "Required in many Tamil Nadu jurisdictions — check with local police station.",
    },
    { type: "ADVANCE_PAYMENT", recurrence: "ONE_TIME", dueDate: addDays(startDate, -7) },
    { type: "DEPOSIT_PAYMENT", recurrence: "ONE_TIME", dueDate: addDays(startDate, -7) },
    { type: "KEY_HANDOVER", recurrence: "ONE_TIME", dueDate: startDate },
    {
      type: "LEASE_RENEWAL_DECISION",
      recurrence: "ONE_TIME",
      dueDate: addDays(endDate, -60),
    },
    {
      type: "VACATE_NOTICE",
      recurrence: "ONE_TIME",
      dueDate: addDays(endDate, -30),
      notes: "Only needed if not renewing.",
    },
  ];

  const recurring: DefaultTaskSpec[] = [
    ...recurringDueDates(startDate, endDate, 1).map((dueDate) => ({
      type: "RENT_COLLECTION" as const,
      recurrence: "MONTHLY" as const,
      dueDate,
    })),
    ...recurringDueDates(startDate, endDate, 1).map((dueDate) => ({
      type: "MAINTENANCE_PAYMENT" as const,
      recurrence: "MONTHLY" as const,
      dueDate,
    })),
    ...recurringDueDates(startDate, endDate, 3).map((dueDate) => ({
      type: "PROPERTY_INSPECTION" as const,
      recurrence: "QUARTERLY" as const,
      dueDate,
    })),
    ...recurringDueDates(startDate, endDate, 3).map((dueDate) => ({
      type: "TDS_FILING" as const,
      recurrence: "QUARTERLY" as const,
      dueDate,
      notes: STATUTORY_DEADLINE_NOTE,
    })),
    ...recurringDueDates(startDate, endDate, 6).map((dueDate) => ({
      type: "PROPERTY_TAX_PAYMENT" as const,
      recurrence: "HALF_YEARLY" as const,
      dueDate,
      notes: STATUTORY_DEADLINE_NOTE,
    })),
    ...recurringDueDates(startDate, endDate, 12).map((dueDate) => ({
      type: "INDIA_TAX_FILING" as const,
      recurrence: "ANNUAL" as const,
      dueDate,
      notes: STATUTORY_DEADLINE_NOTE,
    })),
    ...recurringDueDates(startDate, endDate, 12).map((dueDate) => ({
      type: "US_TAX_FILING" as const,
      recurrence: "ANNUAL" as const,
      dueDate,
      notes: STATUTORY_DEADLINE_NOTE,
    })),
  ];

  return [...oneTime, ...recurring].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );
}
