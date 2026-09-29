"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface ImageUploaderProps {
  initialUrls?: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export default function ImageUploader({ initialUrls, onChange, max }: ImageUploaderProps) {
  const urls = initialUrls ?? [];
  const [previews, setPreviews] = useState<string[]>(() => [...urls]);
  const lastSerialized = useRef<string>("");

  useEffect(() => {
    const next = [...urls];
    const key = next.join("\0");
    if (key === lastSerialized.current) return;
    lastSerialized.current = key;
    setPreviews(next);
  }, [urls]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      setError("");

      try {
        const formData = new FormData();
        files.forEach((f) => formData.append("images", f));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Upload failed");

        const merged = [...previews, ...data.urls];
        const newUrls = max ? merged.slice(0, max) : merged;
        setPreviews(newUrls);
        onChange(newUrls);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [previews, onChange, max]
  );

  const removeImage = (index: number) => {
    const newUrls = previews.filter((_, i) => i !== index);
    setPreviews(newUrls);
    onChange(newUrls);
  };

  const atMax = max != null && previews.length >= max;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {atMax ? null : (
      <label className="block cursor-pointer">
        <input
          type="file"
          multiple={max !== 1}
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleFiles(files);
            e.target.value = "";
          }}
          disabled={uploading}
        />
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Uploading to Cloudinary…</p>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-slate-300 text-sm font-medium">
                Click to upload {max === 1 ? "an image" : "images"}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {max === 1 ? "PNG, JPG, WEBP" : "PNG, JPG, WEBP — multiple files allowed"}
              </p>
            </>
          )}
        </div>
      </label>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {previews.map((url, i) => (
            <div key={url + i} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-slate-600"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
