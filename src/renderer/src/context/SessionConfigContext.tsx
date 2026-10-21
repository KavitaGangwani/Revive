import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { SessionConfig, DraftConfigState } from '../../../shared/types'

interface SessionConfigContextValue {
  config: SessionConfig;
  savedSlotChoices: (string | null)[];
  isLoaded: boolean;
  stepFocusMinutes: (delta: number) => void;
  stepRestMinutes: (delta: number) => void;
  stepLoopCount: (delta: number) => void;
  setSlotActivity: (index: number, activityId: string | null) => Promise<void>;
  startSession: () => Promise<void>;
}

const defaultSessionConfig: SessionConfig = {
  focusMinutes: 30,
  restMinutes: 5,
  loopCount: 2,
  restActivityIds: [null, null]
}

const SessionConfigContext = createContext<SessionConfigContextValue | undefined>(undefined)

export const SessionConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SessionConfig>(defaultSessionConfig)
  const [savedSlotChoices, setSavedSlotChoices] = useState<(string | null)[]>([null, null])
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  const saveTimeoutRef = useRef<any>(null)
  const configRef = useRef<SessionConfig>(config)
  const savedSlotsRef = useRef<(string | null)[]>(savedSlotChoices)

  configRef.current = config
  savedSlotsRef.current = savedSlotChoices

  const getApi = () => window.revive || window.still

  // Load draft config on mount
  useEffect(() => {
    async function loadDraft(): Promise<void> {
      try {
        const api = getApi()
        const draft: DraftConfigState | undefined = await api?.session?.getDraftConfig?.()
        if (draft && draft.config) {
          const loadedConfig = draft.config
          const loadedSlots = Array.isArray(draft.savedSlotChoices) ? draft.savedSlotChoices : []

          // Ensure restActivityIds matches loopCount
          const loopCount = loadedConfig.loopCount || 2
          const restActivityIds = Array.from(
            { length: loopCount },
            (_, i) => loadedSlots[i] ?? loadedConfig.restActivityIds?.[i] ?? null
          )

          setConfig({
            ...loadedConfig,
            restActivityIds
          })
          setSavedSlotChoices(loadedSlots.length > 0 ? loadedSlots : restActivityIds)
        }
      } catch (err) {
        console.error('Failed to load draft session config:', err)
      } finally {
        setIsLoaded(true)
      }
    }

    loadDraft()
  }, [])

  // Debounced IPC save (200ms)
  const debouncedSave = useCallback((nextConfig: SessionConfig, nextChoices: (string | null)[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      const api = getApi()
      api?.session?.setDraftConfig?.({
        ...nextConfig,
        savedSlotChoices: nextChoices
      })
    }, 200)
  }, [])

  const stepFocusMinutes = useCallback((delta: number) => {
    setConfig((prev) => {
      const nextFocus = Math.min(180, Math.max(5, prev.focusMinutes + delta * 5))
      const nextConfig = { ...prev, focusMinutes: nextFocus }
      debouncedSave(nextConfig, savedSlotsRef.current)
      return nextConfig
    })
  }, [debouncedSave])

  const stepRestMinutes = useCallback((delta: number) => {
    setConfig((prev) => {
      const nextRest = Math.min(60, Math.max(1, prev.restMinutes + delta))
      const nextConfig = { ...prev, restMinutes: nextRest }
      debouncedSave(nextConfig, savedSlotsRef.current)
      return nextConfig
    })
  }, [debouncedSave])

  const stepLoopCount = useCallback((delta: number) => {
    setConfig((prev) => {
      const nextLoops = Math.min(8, Math.max(1, prev.loopCount + delta))
      const choices = savedSlotsRef.current
      // Resize restActivityIds from savedSlotChoices without losing earlier choices
      const nextRestActivityIds = Array.from(
        { length: nextLoops },
        (_, i) => choices[i] ?? null
      )
      const nextConfig: SessionConfig = {
        ...prev,
        loopCount: nextLoops,
        restActivityIds: nextRestActivityIds
      }
      debouncedSave(nextConfig, choices)
      return nextConfig
    })
  }, [debouncedSave])

  const setSlotActivity = useCallback(async (index: number, activityId: string | null) => {
    const prevConfig = configRef.current
    const prevChoices = [...savedSlotsRef.current]

    // Ensure choices array is at least index + 1
    while (prevChoices.length <= index) {
      prevChoices.push(null)
    }
    prevChoices[index] = activityId
    setSavedSlotChoices(prevChoices)
    savedSlotsRef.current = prevChoices

    const nextRestActivityIds = Array.from(
      { length: prevConfig.loopCount },
      (_, i) => (i === index ? activityId : (prevConfig.restActivityIds[i] ?? prevChoices[i] ?? null))
    )

    const nextConfig: SessionConfig = {
      ...prevConfig,
      restActivityIds: nextRestActivityIds
    }
    setConfig(nextConfig)
    configRef.current = nextConfig

    // Save immediately to main process store
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    const api = getApi()
    await api?.session?.setDraftConfig?.({
      ...nextConfig,
      savedSlotChoices: prevChoices
    })
  }, [])

  const startSession = useCallback(async () => {
    const current = configRef.current
    // Prune savedSlotChoices to active loopCount when Start is pressed
    const prunedChoices = current.restActivityIds.slice(0, current.loopCount)
    setSavedSlotChoices(prunedChoices)
    savedSlotsRef.current = prunedChoices

    const api = getApi()
    if (api?.session) {
      // Save pruned state
      await api.session.setDraftConfig?.({
        ...current,
        savedSlotChoices: prunedChoices
      })
      await api.session.start(current)
    }
  }, [])

  return (
    <SessionConfigContext.Provider
      value={{
        config,
        savedSlotChoices,
        isLoaded,
        stepFocusMinutes,
        stepRestMinutes,
        stepLoopCount,
        setSlotActivity,
        startSession
      }}
    >
      {children}
    </SessionConfigContext.Provider>
  )
}

export const useSessionConfig = (): SessionConfigContextValue => {
  const context = useContext(SessionConfigContext)
  if (!context) {
    throw new Error('useSessionConfig must be used within SessionConfigProvider')
  }
  return context
}
