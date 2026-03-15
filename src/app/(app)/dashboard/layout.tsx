import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diary",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
