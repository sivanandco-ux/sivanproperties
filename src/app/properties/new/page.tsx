import { createProperty } from "./actions";

export default function NewPropertyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black px-6 py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold mb-6">List a property</h1>

        <form action={createProperty} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Title</span>
            <input
              name="title"
              required
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              placeholder="2BHK apartment in Adyar"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Description</span>
            <textarea
              name="description"
              required
              rows={5}
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              placeholder="Describe the property, amenities, nearby landmarks..."
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Listing type</span>
            <select
              name="listingType"
              defaultValue="RENT"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            >
              <option value="RENT">For Rent</option>
              <option value="SALE">For Sale</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Price (INR)</span>
            <input
              name="priceInInr"
              type="number"
              min="0"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              placeholder="e.g. 35000"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Address</span>
            <input
              name="addressLine"
              required
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              placeholder="Street / area"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">City</span>
              <input
                name="city"
                defaultValue="Chennai"
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">State</span>
              <input
                name="state"
                defaultValue="Tamil Nadu"
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Pincode</span>
            <input
              name="pincode"
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Photos</span>
            <input
              name="photos"
              type="file"
              accept="image/*"
              multiple
              className="rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
          >
            Create listing
          </button>
        </form>
      </div>
    </div>
  );
}
