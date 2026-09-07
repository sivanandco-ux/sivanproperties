"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { createProperty } from "./actions";

export default function NewPropertyForm() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const photoInput = form.elements.namedItem("photos") as HTMLInputElement;
      const files = Array.from(photoInput?.files ?? []);

      const photoUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${files.length}...`);
        const blob = await upload(files[i].name, files[i], {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        photoUrls.push(blob.url);
      }
      formData.delete("photos");
      for (const url of photoUrls) {
        formData.append("photoUrls", url);
      }

      setStatus("Creating listing...");
      await createProperty(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
      setStatus(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-3 py-2">
          {error}
        </p>
      )}

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
        <span className="text-sm font-medium">Address (optional for now)</span>
        <input
          name="addressLine"
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
        disabled={submitting}
        className="mt-2 rounded-full bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50"
      >
        {submitting ? status || "Submitting..." : "Create listing"}
      </button>
    </form>
  );
}
