import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-6">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center py-4">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>

      {/* Meals Header */}
      <Skeleton className="h-4 w-12" />

      {/* Meal Cards */}
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}
