import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "bg-card/80 backdrop-blur shadow-xl shadow-primary/5 border-0",
          headerTitle: "text-3xl font-serif",
          headerSubtitle: "text-base text-muted-foreground",
          socialButtonsBlockButton:
            "bg-background/50 border hover:bg-accent",
          formFieldInput: "bg-background/50 h-12",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 h-12 text-base font-semibold shadow-lg shadow-primary/25",
          footerActionLink: "text-primary font-semibold hover:underline",
        },
      }}
      routing="path"
      path="/register"
      signInUrl="/login"
    />
  );
}
