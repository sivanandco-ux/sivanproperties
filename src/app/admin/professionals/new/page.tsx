import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SiteHeader from "@/components/SiteHeader";
import { PROFESSIONAL_ROLES, PROFESSIONAL_ROLE_LABELS } from "@/lib/professional";
import { createProfessional } from "./actions";

export default async function NewProfessionalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-zinc-500">Admin access only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <div className="px-6 py-10">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-semibold mb-6">Onboard a professional</h1>

          <form action={createProfessional} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Name</span>
              <input
                name="name"
                required
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Role</span>
              <select
                name="role"
                required
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              >
                {PROFESSIONAL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {PROFESSIONAL_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Email (used to sign in)</span>
              <input
                name="email"
                type="email"
                required
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Contact (phone)</span>
              <input
                name="contact"
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">License number (optional)</span>
              <input
                name="licenseNumber"
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Notes (optional)</span>
              <textarea
                name="notes"
                rows={3}
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>

            <button
              type="submit"
              className="mt-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Add professional
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
