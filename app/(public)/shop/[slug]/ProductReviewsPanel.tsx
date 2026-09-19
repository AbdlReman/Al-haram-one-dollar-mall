"use client";

import { useCallback, useEffect, useState } from "react";
import type { IReview } from "@/types/review";
import { REVIEW_ACCESS_STORAGE_KEY } from "@/types/review";

function readTokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(REVIEW_ACCESS_STORAGE_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function saveToken(reviewId: string, token: string) {
  const map = { ...readTokens(), [reviewId]: token };
  localStorage.setItem(REVIEW_ACCESS_STORAGE_KEY, JSON.stringify(map));
}

function removeToken(reviewId: string) {
  const map = { ...readTokens() };
  delete map[reviewId];
  localStorage.setItem(REVIEW_ACCESS_STORAGE_KEY, JSON.stringify(map));
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-500 tracking-tight" aria-hidden>
      {"★".repeat(value)}
      <span className="text-gray-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function ProductReviewsPanel({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tokens, setTokens] = useState<Record<string, string>>({});

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);


  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reviews");
      setReviews(data.reviews || []);
      setTokens(readTokens());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch reviews on mount
    load();
  }, [load]);


  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, authorName, rating, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review");
      if (data.editToken && data.review?._id) saveToken(data.review._id, data.editToken);
      setAuthorName("");
      setRating(5);
      setBody("");
      setShowAddForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id: string) => {
    const token = tokens[id];
    if (!token || !window.confirm("Delete this review permanently?")) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${id}?editToken=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete");
      removeToken(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-4" aria-busy="true" aria-label="Loading reviews">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse border-b border-neutral-100 pb-6 last:border-0">
            <div className="flex justify-between gap-4">
              <div className="h-4 w-28 rounded-md bg-neutral-200" />
              <div className="h-3 w-20 rounded-md bg-neutral-100" />
            </div>
            <div className="mt-3 h-3 w-24 rounded-md bg-neutral-100" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded-md bg-neutral-100" />
              <div className="h-3 w-[90%] rounded-md bg-neutral-50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded">{error}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2">
        <h3 className="text-sm font-black uppercase tracking-widest">
          Customer reviews ({reviews.length})
        </h3>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((open) => !open);
          }}
          className="shrink-0 bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          {showAddForm ? "Close" : "Add review"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={submitNew}
          className="border border-gray-200 p-5 space-y-4 bg-gray-50/50"
        >
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-600">Write a review</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Your name</label>
              <input
                required
                maxLength={80}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white"
                placeholder="e.g. Ali"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "star" : "stars"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Your review</label>
            <textarea
              required
              maxLength={2000}
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm resize-y bg-white"
              placeholder="Share your experience with this product…"
            />
            <p className="text-xs text-gray-400 mt-1">{body.length}/2000</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="border border-gray-300 px-5 py-2.5 text-xs font-bold uppercase text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">After posting, you can delete this review from this browser.</p>
        </form>
      )}

      <div>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet. Use &quot;Add review&quot; to share your experience.</p>
        ) : (
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li key={r._id} className="border-b border-gray-200 pb-6 last:border-0">
                <>
                  <div className="flex flex-wrap items-baseline gap-2 justify-between">
                    <p className="font-bold text-gray-900">{r.authorName}</p>
                    <time className="text-xs text-gray-400" dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <div className="mt-1 text-sm">
                    <Stars value={r.rating} />
                    <span className="sr-only">{r.rating} out of 5 stars</span>
                  </div>
                  <p className="mt-2 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{r.body}</p>
                  {tokens[r._id] && (
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => deleteReview(r._id)}
                        className="text-xs font-bold uppercase text-red-600 underline underline-offset-2"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

