import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Details",
};

export default function FoodLayout({ children }: { children: React.ReactNode }) {
  return children;
}
