"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PixelPet } from "./pixel-pet"
import { PixelPetEffects } from "./pixel-pet-effects"
import { usePetReaction } from "./pet-reaction-provider"
import { trpc } from "@/trpc/react"
import type { PetHealthState } from "@/lib/pet/health"

const PET_SIZE = 64
const HEADER_SAFE = 60
const NAV_SAFE = 80
const WANDER_MIN_MS = 4000
const WANDER_MAX_MS = 8000
const DRAG_PAUSE_MS = 10000

function getAnimationClass(
  healthState: PetHealthState,
  isDragging: boolean,
  isTapped: boolean,
  isReacting: boolean,
  justLanded: boolean
): string {
  if (isDragging) return "animate-[pet-picked-up_0.2s_ease-out_forwards]"
  if (justLanded) return "animate-[pet-landed_0.4s_ease-out_forwards]"
  if (isTapped) return "animate-[pet-tap-bounce_0.4s_ease-out]"
  if (isReacting) return "animate-[pet-happy-react_0.6s_ease-out]"

  switch (healthState) {
    case "thriving":
      return "animate-[pet-bounce_1.2s_ease-in-out_infinite]"
    case "healthy":
      return "animate-[pet-bob_2s_ease-in-out_infinite]"
    case "okay":
      return "animate-[pet-bob_3s_ease-in-out_infinite]"
    case "struggling":
      return "animate-[pet-droop_3s_ease-in-out_infinite]"
  }
}

interface PixelPetWanderProps {
  userId: string
}

export function PixelPetWander({ userId }: PixelPetWanderProps) {
  const [position, setPosition] = useState({ x: 20, y: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isTapped, setIsTapped] = useState(false)
  const [isReacting, setIsReacting] = useState(false)
  const [justLanded, setJustLanded] = useState(false)
  const [effectType, setEffectType] = useState<"hearts" | "sparkles" | null>(null)

  const dragOffset = useRef({ x: 0, y: 0 })
  const wanderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)

  const { reaction, clearReaction } = usePetReaction()

  // Fetch pet health
  const { data: healthData } = trpc.pet.getHealth.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const healthState: PetHealthState = healthData?.healthState ?? "healthy"

  // Random position within safe bounds
  const getRandomPosition = useCallback(() => {
    const maxX = (typeof window !== "undefined" ? window.innerWidth : 400) - PET_SIZE - 16
    const maxY = (typeof window !== "undefined" ? window.innerHeight : 800) - PET_SIZE - NAV_SAFE
    return {
      x: Math.floor(Math.random() * Math.max(1, maxX)),
      y: HEADER_SAFE + Math.floor(Math.random() * Math.max(1, maxY - HEADER_SAFE)),
    }
  }, [])

  // Start wandering
  const startWander = useCallback(() => {
    if (wanderTimer.current) clearTimeout(wanderTimer.current)

    const scheduleNext = () => {
      const delay = WANDER_MIN_MS + Math.random() * (WANDER_MAX_MS - WANDER_MIN_MS)
      wanderTimer.current = setTimeout(() => {
        setPosition(getRandomPosition())
        scheduleNext()
      }, delay)
    }

    scheduleNext()
  }, [getRandomPosition])

  // Stop wandering
  const stopWander = useCallback(() => {
    if (wanderTimer.current) {
      clearTimeout(wanderTimer.current)
      wanderTimer.current = null
    }
  }, [])

  // Initial position + start wandering
  useEffect(() => {
    setPosition(getRandomPosition())
    startWander()
    return stopWander
  }, [getRandomPosition, startWander, stopWander])

  // Handle reactions from food logging etc.
  useEffect(() => {
    if (!reaction) return

    setIsReacting(true)
    if (reaction === "food_logged") {
      setEffectType("sparkles")
    } else if (reaction === "partner_wave") {
      setEffectType("sparkles")
    }

    const timer = setTimeout(() => {
      setIsReacting(false)
      setEffectType(null)
      clearReaction()
    }, 600)

    return () => clearTimeout(timer)
  }, [reaction, clearReaction])

  // Pointer handlers for drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)

    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    hasMoved.current = false

    stopWander()
  }, [position, stopWander])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - dragStartPos.current.x)
    const dy = Math.abs(e.clientY - dragStartPos.current.y)

    if (dx > 5 || dy > 5) {
      if (!hasMoved.current) {
        hasMoved.current = true
        setIsDragging(true)
      }

      const maxX = window.innerWidth - PET_SIZE
      const maxY = window.innerHeight - PET_SIZE
      setPosition({
        x: Math.max(0, Math.min(maxX, e.clientX - dragOffset.current.x)),
        y: Math.max(HEADER_SAFE, Math.min(maxY - NAV_SAFE, e.clientY - dragOffset.current.y)),
      })
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (hasMoved.current) {
      // Was a drag
      setIsDragging(false)
      setJustLanded(true)
      setTimeout(() => setJustLanded(false), 400)

      // Pause wandering after drag
      setTimeout(() => startWander(), DRAG_PAUSE_MS)
    } else {
      // Was a tap
      setIsTapped(true)
      setEffectType("hearts")
      setTimeout(() => {
        setIsTapped(false)
        setEffectType(null)
      }, 400)
      startWander()
    }
  }, [startWander])

  const animClass = getAnimationClass(healthState, isDragging, isTapped, isReacting, justLanded)

  return (
    <div
      className="fixed z-40 cursor-grab select-none active:cursor-grabbing"
      style={{
        left: position.x,
        top: position.y,
        width: PET_SIZE,
        height: PET_SIZE,
        transition: isDragging ? "none" : "left 1.5s ease-in-out, top 1.5s ease-in-out",
        willChange: "transform, left, top",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="relative">
        <div className={animClass}>
          <PixelPet userId={userId} healthState={healthState} size={PET_SIZE} />
        </div>
        <PixelPetEffects type={effectType} onComplete={() => setEffectType(null)} />
        {healthState === "thriving" && (
          <div
            className="pointer-events-none absolute -top-1 -right-1"
            style={{ animation: "pet-sparkle 2s ease-in-out infinite" }}
          >
            <span className="text-[8px]">&#x2728;</span>
          </div>
        )}
        {healthState === "struggling" && (
          <div className="pointer-events-none absolute -top-2 right-0 text-[10px]">
            &#x1F4A7;
          </div>
        )}
      </div>
    </div>
  )
}
