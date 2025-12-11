import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="p-4 space-y-4">
      {/* Title */}
      <Skeleton className="h-8 w-40" />

      {/* Search Input */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Results */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}
