"use client";

import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <Image
          src="/icons/Icon-192.png"
          alt="Eato"
          width={56}
          height={56}
          className="mx-auto mb-4 rounded-xl"
          priority
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
