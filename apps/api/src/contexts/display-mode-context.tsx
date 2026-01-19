"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { trpc } from "@/trpc/react";

export type DisplayMode = "QUALITATIVE" | "EXACT";

interface DisplayModeContextValue {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleDisplayMode: () => void;
  isQualitative: boolean;
  isUpdating: boolean;
}

const DisplayModeContext = createContext<DisplayModeContextValue>({
  displayMode: "QUALITATIVE",
  setDisplayMode: () => {},
  toggleDisplayMode: () => {},
  isQualitative: true,
  isUpdating: false,
});

export function DisplayModeProvider({
  children,
  initialMode = "QUALITATIVE",
  hasProfile = false,
}: {
  children: ReactNode;
  initialMode?: DisplayMode;
  hasProfile?: boolean;
}) {
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(initialMode);
  const [profileExists, setProfileExists] = useState(hasProfile);
  const utils = trpc.useUtils();

  // Sync with initialMode when it changes (e.g., profile loads)
  useEffect(() => {
    setDisplayModeState(initialMode);
  }, [initialMode]);

  // Sync hasProfile prop changes
  useEffect(() => {
    setProfileExists(hasProfile);
  }, [hasProfile]);

  const updateMutation = trpc.profile.updateDisplayMode.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
    },
  });

  const setDisplayMode = useCallback(
    (mode: DisplayMode) => {
      setDisplayModeState(mode);
      // Only persist to database if profile exists
      if (profileExists) {
        updateMutation.mutate({ displayMode: mode });
      }
    },
    [updateMutation, profileExists]
  );

  const toggleDisplayMode = useCallback(() => {
    const newMode = displayMode === "QUALITATIVE" ? "EXACT" : "QUALITATIVE";
    setDisplayMode(newMode);
  }, [displayMode, setDisplayMode]);

  return (
    <DisplayModeContext.Provider
      value={{
        displayMode,
        setDisplayMode,
        toggleDisplayMode,
        isQualitative: displayMode === "QUALITATIVE",
        isUpdating: updateMutation.isPending,
      }}
    >
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  return useContext(DisplayModeContext);
}
