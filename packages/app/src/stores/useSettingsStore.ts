import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the shape of AI configuration and other settings
interface AiConfig {
  baseUrl: string;
  apiKey: string;
}

type Theme = 'dark' | 'light' | 'system';

// Define the state and actions for the settings store
interface SettingsState {
  theme: Theme;
  aiConfig: AiConfig;
  setTheme: (theme: Theme) => void;
  setAiConfig: (config: AiConfig) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'system',
      aiConfig: {
        baseUrl: '',
        apiKey: '',
      },

      // Action to set the theme
      setTheme: (theme) => set({ theme }),

      // Action to set the AI configuration
      setAiConfig: (config) => set({ aiConfig: config }),
    }),
    {
      name: 'entropy-zero-settings', // Name for the localStorage item
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);
