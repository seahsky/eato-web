"use client"

import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"

type ReactionType = "food_logged" | "partner_wave" | null

interface PetReactionContextValue {
  reaction: ReactionType
  triggerReaction: (type: ReactionType) => void
  clearReaction: () => void
}

const PetReactionContext = createContext<PetReactionContextValue>({
  reaction: null,
  triggerReaction: () => {},
  clearReaction: () => {},
})

export function usePetReaction() {
  return useContext(PetReactionContext)
}

export function PetReactionProvider({ children }: { children: ReactNode }) {
  const [reaction, setReaction] = useState<ReactionType>(null)

  const triggerReaction = useCallback((type: ReactionType) => {
    setReaction(type)
  }, [])

  const clearReaction = useCallback(() => {
    setReaction(null)
  }, [])

  return (
    <PetReactionContext.Provider value={{ reaction, triggerReaction, clearReaction }}>
      {children}
    </PetReactionContext.Provider>
  )
}
