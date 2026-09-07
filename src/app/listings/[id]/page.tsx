import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { submitInterest } from "./actions";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { photos: true },
  });

  if (!property) notFound();

  const submitWithId = submitInterest.bind(null, property.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
      <div className="mx-auto max-w-3xl">
        {property.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {property.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={property.title}
                className="w-full aspect-video object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <h1 className="text-2xl font-semibold">{property.title}</h1>
        <p className="text-zinc-500 mb-4">
          {property.addressLine ? `${property.addressLine}, ` : ""}
          {property.city}, {property.state}
          {property.pincode ? ` - ${property.pincode}` : ""}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-sm">
            {property.listingType === "RENT" ? "For Rent" : "For Sale"}
          </span>
          {property.priceInInr && (
            <span className="text-lg font-semibold">
              &#8377;{property.priceInInr.toLocaleString("en-IN")}
              {property.listingType === "RENT" ? " / month" : ""}
            </span>
          )}
        </div>

        <p className="whitespace-pre-wrap mb-10">{property.description}</p>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 max-w-md">
          <h2 className="font-semibold mb-4">I&apos;m interested</h2>
          <form action={submitWithId} className="flex flex-col gap-3">
            <input
              name="name"
              required
              placeholder="Your name"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <input
              name="contact"
              required
              placeholder="Phone or email"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <textarea
              name="message"
              rows={3}
              placeholder="Optional message"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
