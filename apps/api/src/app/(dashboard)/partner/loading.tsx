import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerLoading() {
  return (
    <div className="p-4 space-y-4">
      {/* Title */}
      <Skeleton className="h-8 w-32" />

      {/* Tabs */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Partner Card */}
      <div className="rounded-2xl border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>

        {/* Weekly Progress */}
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
