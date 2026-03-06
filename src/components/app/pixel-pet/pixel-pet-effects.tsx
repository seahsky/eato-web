"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  type: "heart" | "sparkle"
}

let particleId = 0

interface PixelPetEffectsProps {
  type: "hearts" | "sparkles" | null
  onComplete?: () => void
}

export function PixelPetEffects({ type, onComplete }: PixelPetEffectsProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!type) {
      setParticles([])
      return
    }

    const newParticles: Particle[] = Array.from({ length: type === "hearts" ? 3 : 5 }, () => ({
      id: ++particleId,
      x: Math.random() * 40 - 20,
      y: Math.random() * -10,
      type: type === "hearts" ? "heart" as const : "sparkle" as const,
    }))

    setParticles(newParticles)

    const timer = setTimeout(() => {
      setParticles([])
      onComplete?.()
    }, 800)

    return () => clearTimeout(timer)
  }, [type, onComplete])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute left-1/2 top-0"
          style={{
            transform: `translateX(${p.x}px)`,
            animation: p.type === "heart"
              ? "pet-hearts 0.8s ease-out forwards"
              : "pet-sparkle 0.8s ease-out forwards",
          }}
        >
          {p.type === "heart" ? (
            <span className="text-xs">&#x2764;&#xFE0F;</span>
          ) : (
            <span className="text-xs">&#x2728;</span>
          )}
        </div>
      ))}
    </div>
  )
}
