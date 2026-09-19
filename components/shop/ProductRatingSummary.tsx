"use client";

import { useEffect, useState } from "react";

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-hidden>
      {stars.map((s) => (
        <span key={s} className={s <= full ? "text-black" : "text-neutral-200"} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ProductRatingSummary({ productId }: { productId: string }) {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
        const data = await res.json();
        const reviews = Array.isArray(data.reviews) ? data.reviews : [];
        if (!cancelled && reviews.length > 0) {
          const sum = reviews.reduce((acc: number, r: { rating: number }) => acc + Number(r.rating || 0), 0);
          setAvg(sum / reviews.length);
          setCount(reviews.length);
        } else if (!cancelled) {
          setAvg(null);
          setCount(0);
        }
      } catch {
        if (!cancelled) {
          setAvg(null);
          setCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return <div className="h-4 w-40 animate-pulse bg-neutral-200" aria-hidden />;
  }

  if (avg === null || count === 0) {
    return <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">No reviews yet</p>;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-black"
      role="group"
      aria-label={`${avg.toFixed(1)} out of 5 stars, ${count} reviews`}
    >
      <Stars value={avg} />
      <span className="tabular-nums">{avg.toFixed(1)}</span>
      <span className="font-normal normal-case tracking-normal text-neutral-600">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}
