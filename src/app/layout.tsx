// Minimal root layout. Next.js App Router requires `app/layout.tsx` to exist
// even for API-only deployments. No HTML/body styling needed — this app
// serves no user-facing pages.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
