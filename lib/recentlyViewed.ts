export const RECENTLY_VIEWED_KEY = "puma_recently_viewed";

export type RecentViewEntry = {
  slug: string;
  name: string;
  image: string;
  price: number;
  discount: number;
};

const MAX = 10;

export function readRecentlyViewed(): RecentViewEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (x): x is RecentViewEntry =>
          x &&
          typeof x.slug === "string" &&
          typeof x.name === "string" &&
          typeof x.image === "string"
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function writeRecentlyViewed(entries: RecentViewEntry[]) {
  if (typeof window === "undefined") return;
  const next = entries
    .filter(
      (x): x is RecentViewEntry =>
        x &&
        typeof x.slug === "string" &&
        typeof x.name === "string" &&
        typeof x.image === "string"
    )
    .slice(0, MAX);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
}

export function pushRecentlyViewed(entry: RecentViewEntry, excludeSlug?: string) {
  if (typeof window === "undefined") return;
  const prev = readRecentlyViewed().filter((e) => e.slug !== entry.slug && e.slug !== excludeSlug);
  const next = [entry, ...prev].slice(0, MAX);
  writeRecentlyViewed(next);
}
