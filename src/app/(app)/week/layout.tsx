import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Week",
};

export default function WeekLayout({ children }: { children: React.ReactNode }) {
  return children;
}
