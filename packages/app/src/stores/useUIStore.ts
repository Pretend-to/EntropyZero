import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UIState, ViewType, ThemeType } from '../types'

interface UIStore extends UIState {
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setActiveView: (view: ViewType) => void
  setTheme: (theme: ThemeType) => void
  setLanguage: (language: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      activeView: 'canvas',
      theme: 'dark',
      language: 'zh-CN',

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      setCommandPaletteOpen: (open) =>
        set({ commandPaletteOpen: open }),

      setActiveView: (view) =>
        set({ activeView: view }),

      setTheme: (theme) =>
        set({ theme }),

      setLanguage: (language) =>
        set({ language }),
    }),
    {
      name: 'entropy-zero-ui-state',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeView: state.activeView,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)