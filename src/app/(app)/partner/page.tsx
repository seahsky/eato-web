"use client"

import { useState } from "react"
import { Heart, HandHeart, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PixelPet } from "@/components/app/pixel-pet/pixel-pet"
import { trpc } from "@/trpc/react"
import type { PetHealthState } from "@/lib/pet/health"

const INTERACTION_TYPES = [
  { type: "wave" as const, icon: HandHeart, label: "Wave" },
  { type: "pet" as const, icon: Heart, label: "Pet" },
  { type: "highfive" as const, icon: Sparkles, label: "High Five" },
]

function HealthLabel({ state }: { state: PetHealthState }) {
  const labels: Record<PetHealthState, { text: string; color: string }> = {
    thriving: { text: "Thriving", color: "text-primary" },
    healthy: { text: "Healthy", color: "text-green-600" },
    okay: { text: "Okay", color: "text-yellow-600" },
    struggling: { text: "Needs love", color: "text-orange-600" },
  }
  const { text, color } = labels[state]
  return <span className={`text-sm font-medium ${color}`}>{text}</span>
}

export default function PartnerPage() {
  const [interactionSent, setInteractionSent] = useState<string | null>(null)

  const { data: me } = trpc.auth.getMe.useQuery()
  const { data: myHealth } = trpc.pet.getHealth.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const { data: partnerHealth } = trpc.pet.getPartnerHealth.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    enabled: !!me?.partnerId,
  })
  const { data: interactions } = trpc.pet.getInteractions.useQuery(undefined, {
    staleTime: 60 * 1000,
  })

  const sendInteraction = trpc.pet.sendInteraction.useMutation({
    onSuccess: (_data, variables) => {
      setInteractionSent(variables.type)
      setTimeout(() => setInteractionSent(null), 2000)
    },
  })

  const myHealthState: PetHealthState = myHealth?.healthState ?? "healthy"
  const partnerHealthState: PetHealthState = partnerHealth?.healthState ?? "healthy"

  if (!me?.partnerId || !me.partner) {
    return (
      <div className="mx-auto max-w-lg px-4">
        <div className="flex items-center gap-2 py-3">
          <h1 className="text-lg font-bold">Partner</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Heart className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Link with a partner to see their pet and interact!
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Go to Profile to generate a partner link code.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4">
      <div className="flex items-center gap-2 py-3">
        <h1 className="text-lg font-bold">Partner Pets</h1>
      </div>

      {/* Both pets side-by-side */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-around">
            {/* My pet */}
            <div className="flex flex-col items-center gap-2">
              <PixelPet userId={me.id} healthState={myHealthState} size={80} />
              <p className="text-sm font-medium">Your pet</p>
              <HealthLabel state={myHealthState} />
              <p className="text-xs text-muted-foreground">
                {myHealth?.daysOnGoal ?? 0}/7 days on goal
              </p>
            </div>

            {/* Heart divider */}
            <div className="flex flex-col items-center gap-1">
              <Heart className="h-5 w-5 text-primary" />
            </div>

            {/* Partner's pet */}
            <div className="flex flex-col items-center gap-2">
              <PixelPet userId={me.partnerId} healthState={partnerHealthState} size={80} />
              <p className="text-sm font-medium">{me.partner.name || "Partner"}&apos;s pet</p>
              <HealthLabel state={partnerHealthState} />
              <p className="text-xs text-muted-foreground">
                {partnerHealth?.daysOnGoal ?? 0}/7 days on goal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interaction buttons */}
      <div className="mt-4">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Interact with partner&apos;s pet
        </h2>
        <div className="flex gap-2">
          {INTERACTION_TYPES.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant="outline"
              className="flex-1"
              disabled={sendInteraction.isPending}
              onClick={() => sendInteraction.mutate({ type })}
            >
              <Icon className="mr-1.5 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
        {interactionSent && (
          <p className="mt-2 text-center text-sm text-primary">
            {interactionSent === "wave" ? "Waved" : interactionSent === "pet" ? "Petted" : "High-fived"} partner&apos;s pet!
          </p>
        )}
        {sendInteraction.error && (
          <p className="mt-2 text-center text-sm text-destructive">
            {sendInteraction.error.message}
          </p>
        )}
      </div>

      {/* Recent interactions */}
      {interactions && interactions.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Recent interactions
          </h2>
          <div className="space-y-2">
            {interactions.slice(0, 5).map((interaction: { id: string; fromUser: { name: string | null }; type: string; createdAt: string }) => (
              <div key={interaction.id} className="flex items-center gap-2 text-sm">
                <Heart className="h-3 w-3 text-primary" />
                <span>
                  {interaction.fromUser.name || "Partner"} {interaction.type === "wave" ? "waved at" : interaction.type === "pet" ? "petted" : "high-fived"} your pet
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
