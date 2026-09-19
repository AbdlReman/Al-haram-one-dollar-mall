export function ShopProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[1/1.15] bg-neutral-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-16 bg-neutral-200" />
            <div className="h-4 w-[85%] bg-neutral-200" />
            <div className="h-3 w-20 bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
