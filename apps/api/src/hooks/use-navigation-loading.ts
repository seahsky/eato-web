"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
    setPendingPath(null);
  }, [pathname]);

  const navigate = (href: string) => {
    if (href === pathname) return;

    setIsNavigating(true);
    setPendingPath(href);

    startTransition(() => {
      router.push(href);
    });
  };

  return {
    isNavigating: isNavigating || isPending,
    pendingPath,
    navigate,
    currentPath: pathname,
  };
}
