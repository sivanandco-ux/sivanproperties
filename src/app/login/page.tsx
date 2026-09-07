import Image from "next/image";
import { signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <Image
          src="/logo/sivan-properties.jpg"
          alt="Sivan Properties"
          width={112}
          height={112}
          className="mx-auto mb-4 rounded-xl"
          priority
        />
        <p className="text-sm text-zinc-500 mb-6">
          This site is in development. Access is limited to approved testers.
        </p>

        {error && (
          <p className="mb-4 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-3 py-2">
            {error === "AccessDenied"
              ? "That Google account isn't on the approved tester list yet."
              : "Something went wrong signing in. Please try again."}
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: redirectTo || "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
