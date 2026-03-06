import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/app/bottom-nav";
import { PetReactionProvider } from "@/components/app/pixel-pet/pet-reaction-provider";
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
  let profileCompleted = true;
  try {
    const caller = await serverTrpc();
    const user = await caller.auth.getMe();
    if (user) {
      profileCompleted = user.profileCompleted;
    }
  } catch (error) {
    console.error("[AppLayout] Failed to fetch user:", error);
  }

  if (!profileCompleted) {
    redirect("/profile-setup");
  }

  return (
    <PetReactionProvider>
      <div className="pb-20">
        {children}
        <BottomNav />
      </div>
    </PetReactionProvider>
  );
}
