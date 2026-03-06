"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <img
          src="/icons/Icon-192.png"
          alt="Eato"
          className="mx-auto mb-4 h-20 w-20 rounded-2xl"
        />
        <h1 className="text-3xl font-bold text-primary">Eato</h1>
        <p className="text-muted-foreground">
          Track calories together with your partner
        </p>
      </div>
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
