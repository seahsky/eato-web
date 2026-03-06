import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/app/bottom-nav";
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
  } catch {
    // If we can't fetch user, let the page handle it
  }

  return (
    <div className="pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
