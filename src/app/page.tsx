import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type PropertyWithPhoto = Prisma.PropertyGetPayload<{
  include: { photos: { take: 1 } };
}>;

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  const properties: PropertyWithPhoto[] = await prisma.property.findMany({
    where: { status: "ACTIVE" },
    include: { photos: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="/logo/sivan-properties.jpg"
            alt="Sivan Properties"
            width={112}
            height={112}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-2xl font-semibold">Sivan Properties</h1>
            <p className="text-sm text-zinc-500">
              Chennai listings for NRI owners &mdash; rent or sale
            </p>
          </div>
        </div>
        {session?.user && (
          <Link
            href="/properties/new"
            className="shrink-0 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
          >
            List a property
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {properties.length === 0 ? (
          <p className="text-zinc-500">No listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => {
              const isOwner = session?.user?.id === property.ownerId;
              return (
                <div
                  key={property.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <Link href={`/listings/${property.id}`}>
                    <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm">
                      {property.photos[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={property.photos[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "No photo"
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-medium">{property.title}</h2>
                      <p className="text-sm text-zinc-500">
                        {property.city} &middot;{" "}
                        {property.listingType === "RENT" ? "For Rent" : "For Sale"}
                      </p>
                      {property.priceInInr && (
                        <p className="text-sm font-semibold mt-1">
                          &#8377;{property.priceInInr.toLocaleString("en-IN")}
                          {property.listingType === "RENT" ? " / month" : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                  {isOwner && (
                    <Link
                      href={`/properties/${property.id}`}
                      className="block border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-center hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      Manage
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
