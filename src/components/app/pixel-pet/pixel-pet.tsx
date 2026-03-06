"use client"

import { useMemo } from "react"
import { generatePetTraits } from "@/lib/pet/generator"
import { SPECIES_TEMPLATES } from "@/lib/pet/templates"
import { generatePalette } from "@/lib/pet/colors"
import { PixelPetCanvas } from "./pixel-pet-canvas"
import type { PetHealthState } from "@/lib/pet/health"

interface PixelPetProps {
  userId: string
  healthState?: PetHealthState
  size?: number
  className?: string
}

export function PixelPet({ userId, healthState = "healthy", size = 64, className }: PixelPetProps) {
  const { template, palette } = useMemo(() => {
    const traits = generatePetTraits(userId)
    const tmpl = SPECIES_TEMPLATES[traits.species]
    const pal = generatePalette(traits, healthState)
    return { template: tmpl, palette: pal }
  }, [userId, healthState])

  return (
    <div className={className} style={{ width: size, height: size }}>
      <PixelPetCanvas template={template} palette={palette} size={size} />
    </div>
  )
}
