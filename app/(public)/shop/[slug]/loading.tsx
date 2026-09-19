export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-white pb-24">
      <div className="border-b border-neutral-200">
        <div className="mx-auto max-w-[90rem] px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-3 w-40 bg-neutral-200" />
        </div>
      </div>
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="aspect-square bg-neutral-200" />
        <div className="space-y-4">
          <div className="h-3 w-20 bg-neutral-200" />
          <div className="h-8 w-full max-w-md bg-neutral-200" />
          <div className="h-6 w-32 bg-neutral-100" />
          <div className="h-20 w-full bg-neutral-100" />
          <div className="h-11 w-full bg-black/20" />
        </div>
      </div>
    </div>
  );
}
