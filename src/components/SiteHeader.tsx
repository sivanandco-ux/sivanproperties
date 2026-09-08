import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3 shrink-0">
        <Image
          src="/logo/sivan-properties.jpg"
          alt="Sivan Properties"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <span className="font-semibold hidden sm:inline">Sivan Properties</span>
      </Link>

      {session?.user && (
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || session.user.email || "Signed in user"}
                width={32}
                height={32}
                className="rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            )}
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-sm font-medium">
                {session.user.name || session.user.email}
              </span>
              <span className="text-xs text-zinc-500">{session.user.role}</span>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-foreground underline"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
