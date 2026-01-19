"use client";

import { trpc } from "@/trpc/react";
import { FeedItem } from "./feed-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PartnerFeed() {
  const { data, isLoading, error } = trpc.stats.getPartnerActivity.useQuery(
    { limit: 20 },
    {
      refetchInterval: 30000, // 30 second polling
      staleTime: 10000,
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-sm">Failed to load activity</p>
        <p className="text-xs mt-1">Please try again later</p>
      </div>
    );
  }

  if (!data?.items?.length) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">No activity yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          {data?.partnerName ? (
            <>Nudge {data.partnerName} to start tracking!</>
          ) : (
            <>Connect with your partner to see their activity</>
          )}
        </p>
        {!data?.partnerName && (
          <Link href="/partner">
            <Button size="sm" variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              Link Partner
            </Button>
          </Link>
        )}
      </div>
    );
  }

  const partnerName = data.partnerName ?? "Partner";

  return (
    <div className="space-y-3">
      {data.items.map((item) => (
        <FeedItem
          key={item.id}
          item={item}
          partnerName={partnerName}
        />
      ))}
    </div>
  );
}
