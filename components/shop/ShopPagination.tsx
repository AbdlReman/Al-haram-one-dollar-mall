"use client";

function visiblePageNumbers(page: number, pageCount: number): number[] {
  const s = new Set<number>();
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) s.add(i);
  }
  return [...s].sort((a, b) => a - b);
}

type Props = {
  page: number;
  pageCount: number;
  totalItems: number;
  onPageChange: (p: number) => void;
};

export default function ShopPagination({ page, pageCount, totalItems, onPageChange }: Props) {
  if (pageCount <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);
  const nums = visiblePageNumbers(page, pageCount);

  const btn =
    "inline-flex min-h-10 min-w-10 items-center justify-center border border-neutral-300 bg-white text-xs font-bold uppercase tracking-wider text-black transition hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="mt-10 flex flex-col items-stretch gap-4 border-t border-neutral-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-neutral-600 tabular-nums" aria-live="polite">
        Page {page} of {pageCount}
        <span className="hidden sm:inline"> · {totalItems} items</span>
      </p>
      <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
        <button type="button" onClick={() => onPageChange(prev)} disabled={page <= 1} className={btn} aria-label="Previous">
          ‹
        </button>
        {nums.map((p, idx) => {
          const prevNum = nums[idx - 1];
          const showEllipsis = idx > 0 && prevNum !== undefined && p - prevNum > 1;
          return (
            <span key={p} className="flex items-center">
              {showEllipsis ? (
                <span className="px-1 text-neutral-400" aria-hidden>
                  …
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`${btn} ${p === page ? "border-black bg-black text-white hover:bg-black" : ""}`}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button type="button" onClick={() => onPageChange(next)} disabled={page >= pageCount} className={btn} aria-label="Next">
          ›
        </button>
      </nav>
    </div>
  );
}
