"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { createProperty } from "./actions";

type PickedPhoto = { file: File; previewUrl: string };

export default function NewPropertyForm() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      for (const p of photos) URL.revokeObjectURL(p.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${photos.length}...`);
        const blob = await upload(photos[i].file.name, photos[i].file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        photoUrls.push(blob.url);
      }
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Photos</span>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`cursor-pointer rounded border-2 border-dashed px-4 py-8 text-center text-sm transition-colors ${
            isDragging
              ? "border-foreground bg-zinc-100 dark:bg-zinc-900"
              : "border-zinc-300 dark:border-zinc-700 text-zinc-500"
          }`}
        >
          Drag and drop photos here, or click to browse
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {photos.map((photo, index) => (
              <div key={photo.previewUrl} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={photo.file.name}
                  className="w-full aspect-square object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={`Remove ${photo.file.name}`}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white text-xs hover:bg-black/90"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
