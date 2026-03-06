import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/app/bottom-nav";
import { PetReactionProvider } from "@/components/app/pixel-pet/pet-reaction-provider";
import { PixelPetWander } from "@/components/app/pixel-pet/pixel-pet-wander";
import { serverTrpc } from "@/trpc/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  // Check if profile is complete
  let dbUserId: string | null = null;
  try {
    const caller = await serverTrpc();
    const user = await caller.auth.getMe();
    if (user && !user.profileCompleted) {
      redirect("/profile-setup");
    }
    dbUserId = user?.id ?? null;
  } catch (error) {
    console.error("[AppLayout] Failed to fetch user:", error);
    // Fallback: query DB directly so the pet still renders
    try {
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });
      dbUserId = user?.id ?? null;
    } catch (fallbackError) {
      console.error("[AppLayout] Fallback DB query also failed:", fallbackError);
    }
  }

  return (
    <PetReactionProvider>
      <div className="pb-20">
        {children}
        <BottomNav />
        {dbUserId && <PixelPetWander userId={dbUserId} />}
      </div>
    </PetReactionProvider>
  );
}
