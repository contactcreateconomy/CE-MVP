import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shimmer skeleton for a discussion card.
 * Shows while discussions are loading.
 */
export function DiscussionCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-12 rounded-md" />
        </div>
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-6 rounded-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}
