import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Setup",
};

export default function ProfileSetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
