import { BottomNav } from "@/components/layout/bottom-nav";
import { DashboardProviders } from "@/components/providers/dashboard-providers";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <DashboardProviders>
        <main className="max-w-lg mx-auto">{children}</main>
        <BottomNav />
      </DashboardProviders>
    </div>
  );
}
