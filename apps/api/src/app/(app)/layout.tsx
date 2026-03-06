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
  } catch {
    // If we can't fetch user, let the page handle it
  }

  return (
    <PetReactionProvider>
      <div className="pb-16">
        {children}
        <BottomNav />
        {dbUserId && <PixelPetWander userId={dbUserId} />}
      </div>
    </PetReactionProvider>
  );
}
