import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useI18n } from '../hooks/useI18n'
import { useUIStore } from '../stores/useUIStore'
import { useTaskStore } from '../stores/useTaskStore'
import './CommandPalette.css'

interface SuggestionItem {
  id: string
  icon: string
  title: string
  description: string
  shortcut?: string
  action: () => void
  type: 'command' | 'task' | 'ai' | 'navigation'
}

interface SuggestionGroup {
  id: string
  title: string
  items: SuggestionItem[]
}

const CommandPalette: React.FC = () => {
  const { t } = useI18n()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const { tasks, addTask } = useTaskStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredGroups, setFilteredGroups] = useState<SuggestionGroup[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    setCommandPaletteOpen(false)
    setSearchTerm('')
    setSelectedIndex(0)
  }, [setCommandPaletteOpen])

  useEffect(() => {
    if (commandPaletteOpen) {
      inputRef.current?.focus()
    }
  }, [commandPaletteOpen])

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<span class="highlight">$1</span>')
  }

  const renderHighlightedText = (text: string, query: string) => {
    return (
      <span dangerouslySetInnerHTML={{ __html: highlightText(text, query) }} />
    )
  }

  const allSuggestions: SuggestionGroup[] = [
    {
      id: 'quick-actions',
      title: t('ui:commandPalette.quickActions'),
      items: [
        {
          id: 'create-task',
          icon: '➕',
          title: t('ui:commandPalette.createTask'),
          description: t('ui:commandPalette.createTaskDescription'),
          shortcut: '⌘N',
          action: () => {
            addTask({
              title: t('task.placeholders.taskTitle'),
              status: 'todo',
              priority: 'medium',
              position: { x: 200, y: 200 },
              tags: [],
            })
            handleClose()
          },
          type: 'command',
        },
        {
          id: 'search-tasks',
          icon: '🔍',
          title: t('ui:commandPalette.searchTasks'),
          description: t('ui:commandPalette.searchTasksDescription'),
          shortcut: '⌘F',
          action: () => console.log('Search tasks'),
          type: 'command',
        },
        {
          id: 'connect-tasks',
          icon: '🔗',
          title: t('ui:canvas.connectTasks'),
          description: t('ui:commandPalette.connectTasksDescription'),
          shortcut: '⌘L',
          action: () => console.log('Connect tasks'),
          type: 'command',
        },
      ],
    },
    {
      id: 'ai-assistant',
      title: t('ui:commandPalette.aiAssistant'),
      items: [
        {
          id: 'ai-task-breakdown',
          icon: '🤖',
          title: t('ui:commandPalette.aiTaskBreakdown'),
          description: t('ui:commandPalette.aiTaskBreakdownDescription'),
          action: () => console.log('AI task breakdown'),
          type: 'ai',
        },
        {
          id: 'ai-project-planning',
          icon: '📊',
          title: t('ui:commandPalette.aiProjectPlanning'),
          description: t('ui:commandPalette.aiProjectPlanningDescription'),
          action: () => console.log('AI project planning'),
          type: 'ai',
        },
        {
          id: 'ai-priority-advice',
          icon: '🎯',
          title: t('ui:commandPalette.aiPriorityAdvice'),
          description: t('ui:commandPalette.aiPriorityAdviceDescription'),
          action: () => console.log('AI priority advice'),
          type: 'ai',
        },
      ],
    },
    {
      id: 'recent-tasks',
      title: t('ui:commandPalette.recentTasksTitle'),
      items: tasks.slice(0, 3).map((task) => ({
        id: task.id,
        icon: '📝',
        title: task.title,
        description: task.description || '',
        action: () => console.log(`Open task ${task.id}`),
        type: 'task',
      })),
    },
    {
      id: 'navigation',
      title: t('ui:commandPalette.navigationTitle'),
      items: [
        {
          id: 'go-to-canvas',
          icon: '🏠',
          title: t('ui:commandPalette.goToCanvas'),
          description: t('ui:commandPalette.goToCanvasDescription'),
          shortcut: '⌘H',
          action: () => console.log('Go to canvas'),
          type: 'navigation',
        },
        {
          id: 'open-settings',
          icon: '⚙️',
          title: t('ui:commandPalette.openSettings'),
          description: t('ui:commandPalette.openSettingsDescription'),
          shortcut: '⌘,',
          action: () => console.log('Open settings'),
          type: 'navigation',
        },
      ],
    },
  ]

  useEffect(() => {
    const filterSuggestions = () => {
      if (!searchTerm) {
        setFilteredGroups(allSuggestions)
        return
      }

      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      const newFilteredGroups: SuggestionGroup[] = []

      allSuggestions.forEach((group) => {
        const filteredItems = group.items.filter(
          (item) =>
            item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.description.toLowerCase().includes(lowerCaseSearchTerm)
        )
        if (filteredItems.length > 0) {
          newFilteredGroups.push({ ...group, items: filteredItems })
        }
      })

      if (newFilteredGroups.length === 0) {
        // AI suggestions if no direct matches
        newFilteredGroups.push({
          id: 'ai-suggestions',
          title: t('ui:commandPalette.aiAssistant'),
          items: [
            {
              id: 'ai-create-task',
              icon: '🤖',
              title: t('ui:commandPalette.createTask', { query: searchTerm }),
              description: t('ui:commandPalette.aiCreateTaskDescription'),
              action: () => console.log(`AI create task: ${searchTerm}`),
              type: 'ai',
            },
            {
              id: 'ai-search-related',
              icon: '🔍',
              title: t('ui:commandPalette.aiSearchRelatedTasks'),
              description: t('ui:commandPalette.aiSearchRelatedTasksDescription', { query: searchTerm }),
              action: () => console.log(`AI search related: ${searchTerm}`),
              type: 'ai',
            },
          ],
        })
      }
      setFilteredGroups(newFilteredGroups)
      setSelectedIndex(0)
    }

    filterSuggestions()
  }, [searchTerm, tasks, t])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const items = suggestionsRef.current?.querySelectorAll('.suggestion-item') || []
      if (items.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const currentItem = filteredGroups
          .flatMap((group) => group.items)
          .find((_, i) => i === selectedIndex)
        currentItem?.action()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [filteredGroups, selectedIndex, handleClose]
  )

  useEffect(() => {
    if (commandPaletteOpen) {
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.removeEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [commandPaletteOpen, handleKeyDown])

  if (!commandPaletteOpen) return null

  return (
    <div className="backdrop" onClick={handleClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-container">
          <input
            type="text"
            className="command-input"
            placeholder={t('ui:commandPalette.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            ref={inputRef}
            aria-label={t('ui:commandPalette.placeholder')}
          />
        </div>

        <div className="command-suggestions" ref={suggestionsRef}>
          {filteredGroups.map((group) => (
            <div key={group.id} className="suggestion-group">
              <div className="suggestion-group-title">{group.title}</div>
              {group.items.map((item, itemIndex) => {
                const globalIndex = filteredGroups
                  .slice(0, filteredGroups.findIndex(g => g.id === group.id))
                  .flatMap(g => g.items).length + itemIndex;

                return (
                  <div
                    key={item.id}
                    className={`suggestion-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="suggestion-icon">{item.icon}</div>
                    <div className="suggestion-content">
                      <div className="suggestion-title">
                        {renderHighlightedText(item.title, searchTerm)}
                      </div>
                      <div className="suggestion-description">
                        {renderHighlightedText(item.description, searchTerm)}
                      </div>
                    </div>
                    {item.shortcut && (
                      <div className="suggestion-shortcut">{item.shortcut}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="command-footer">
          <div className="footer-shortcuts">
            <div className="footer-shortcut">
              <span className="key">↑↓</span>
              <span>{t('ui:commandPalette.footerNavigate')}</span>
            </div>
            <div className="footer-shortcut">
              <span className="key">Enter</span>
              <span>{t('ui:commandPalette.footerSelect')}</span>
            </div>
            <div className="footer-shortcut">
              <span className="key">Esc</span>
              <span>{t('ui:commandPalette.footerClose')}</span>
            </div>
          </div>
          <div className="ai-indicator">
            <div className="ai-pulse"></div>
            <span>{t('ui:commandPalette.aiReady')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette