import React from 'react'
import { useI18n } from './hooks/useI18n'
import Sidebar from './components/Sidebar'
import CanvasView from './components/CanvasView'
import CommandPalette from './components/CommandPalette'
import { useUIStore } from './stores/useUIStore'
import './styles/globals.css'
import './App.css'

function App() {
  const { language } = useI18n()
  const { commandPaletteOpen, sidebarCollapsed, setCommandPaletteOpen } = useUIStore()

  // 设置 HTML 语言属性
  React.useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  // 全局快捷键处理
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K 或 Ctrl+K 打开指令面板
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  return (
    <div className="app">
      <Sidebar collapsed={sidebarCollapsed} />
      <main className="main-content">
        <CanvasView />
      </main>
      {commandPaletteOpen && <CommandPalette />}
    </div>
  )
}

export default App
