import { createContext, useContext, useState, ReactNode } from 'react'

type SedeContextType = {
  selectedSede: 'coquimbo' | 'antofagasta'
  setSelectedSede: (sede: 'coquimbo' | 'antofagasta') => void
}

const SedeContext = createContext<SedeContextType | undefined>(undefined)

export function useSedeContext() {
  const context = useContext(SedeContext)
  if (context === undefined) {
    throw new Error('useSedeContext must be used within a SedeProvider')
  }
  return context
}

interface SedeProviderProps {
  children: ReactNode
}

export function SedeProvider({ children }: SedeProviderProps) {
  const [selectedSede, setSelectedSede] = useState<'coquimbo' | 'antofagasta'>('coquimbo')

  return (
    <SedeContext.Provider value={{ selectedSede, setSelectedSede }}>
      {children}
    </SedeContext.Provider>
  )
}
