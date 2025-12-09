import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Leaf, Users, Target, TrendingUp } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Hero */}
      <div className="px-6 pt-16 pb-12 text-center">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20 mb-6">
          <Leaf className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-serif font-semibold tracking-tight mb-3">
          Eato
        </h1>
        <p className="text-lg text-muted-foreground max-w-xs mx-auto">
          Track your diet together, reach your goals together
        </p>
      </div>

      {/* Features */}
      <div className="px-6 py-8 space-y-4 max-w-md mx-auto">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur border border-border/50">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Track Calories</h3>
            <p className="text-sm text-muted-foreground">
              Log meals easily with our food database or quick manual entry
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur border border-border/50">
          <div className="p-2.5 rounded-xl bg-secondary">
            <Users className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Partner Mode</h3>
            <p className="text-sm text-muted-foreground">
              Link accounts with your partner and track progress together
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur border border-border/50">
          <div className="p-2.5 rounded-xl bg-accent">
            <TrendingUp className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">BMR Calculator</h3>
            <p className="text-sm text-muted-foreground">
              Know your daily needs with personalized BMR and TDEE calculations
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-8 max-w-md mx-auto space-y-3">
        <Link href="/register" className="block">
          <Button className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/25">
            Get Started
          </Button>
        </Link>
        <Link href="/login" className="block">
          <Button variant="outline" className="w-full h-14 text-lg">
            Sign In
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Your data is stored securely and never shared
        </p>
      </div>
    </div>
  );
}
