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
  try {
    const caller = await serverTrpc();
    const user = await caller.auth.getMe();
    if (user && !user.profileCompleted) {
      redirect("/profile-setup");
    }
  } catch (error) {
    console.error("[AppLayout] Failed to fetch user:", error);
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
