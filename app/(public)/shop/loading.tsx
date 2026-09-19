import { ShopProductSkeletonGrid } from "@/components/shop/ShopProductSkeleton";

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-neutral-200 bg-black">
        <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-3 w-32 animate-pulse bg-neutral-700" />
          <div className="mt-6 h-8 w-48 animate-pulse bg-neutral-700" />
        </div>
      </div>
      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">
        <ShopProductSkeletonGrid count={12} />
      </div>
    </div>
  );
}
