import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useI18n } from '../hooks/useI18n'
import { useUIStore } from '../stores/useUIStore'
import { useTaskStore } from '../stores/useTaskStore'
import { useTaskCreator } from '../hooks/useTaskCreator'
import './CommandPalette.css'

type SceneType = 'default' | 'ai' | 'search' | 'template' | 'workflow' | 'settings' | 'help'

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
  const { tasks } = useTaskStore()
  const { createTaskAtCenter } = useTaskCreator()

  const [searchTerm, setSearchTerm] = useState('')
  const [currentScene, setCurrentScene] = useState<SceneType>('default')
  const [filteredGroups, setFilteredGroups] = useState<SuggestionGroup[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'assistant', content: string}>>([
    { type: 'assistant', content: t('ui:commandPalette.aiWelcome') }
  ])
  const [isClosing, setIsClosing] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    const shouldExpand = currentScene !== 'default' || searchTerm.trim() !== ''
    
    if (shouldExpand) {
      // If expanded, first collapse then close
      setIsClosing(true)
      setSearchTerm('')
      setCurrentScene('default')
      
      // Wait for collapse animation, then close
      setTimeout(() => {
        setCommandPaletteOpen(false)
        setSelectedIndex(0)
        setIsClosing(false)
        setIsEntering(true) // Reset for next open
      }, 300) // Match the collapse animation duration
    } else {
      // If not expanded, close directly with exit animation
      setIsClosing(true)
      
      // Wait for exit animation, then close
      setTimeout(() => {
        setCommandPaletteOpen(false)
        setSelectedIndex(0)
        setIsClosing(false)
        setIsEntering(true) // Reset for next open
      }, 200) // Match the exit animation duration
    }
  }, [setCommandPaletteOpen, currentScene, searchTerm])

  useEffect(() => {
    if (commandPaletteOpen) {
      // Reset entering state when opening
      setIsEntering(true)
      // Trigger enter animation after a brief delay
      const timer = setTimeout(() => {
        setIsEntering(false)
      }, 10) // Very short delay to ensure initial render
      
      return () => clearTimeout(timer)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    if (commandPaletteOpen) {
      inputRef.current?.focus()
    }
  }, [commandPaletteOpen])

  // Scene detection and switching
  const detectAndSwitchScene = useCallback((input: string) => {
    const scenes: Record<string, SceneType> = {
      '/ai': 'ai',
      '/search': 'search', 
      '/template': 'template',
      '/workflow': 'workflow',
      '/settings': 'settings',
      '/help': 'help'
    }

    for (const [prefix, scene] of Object.entries(scenes)) {
      if (input.startsWith(prefix)) {
        setCurrentScene(scene)
        setSelectedIndex(0)
        
        // Focus appropriate input based on scene
        if (scene === 'ai') {
          setTimeout(() => chatInputRef.current?.focus(), 100)
        }
        return true
      }
    }
    return false
  }, [])

  const handleInput = useCallback((value: string) => {
    setSearchTerm(value)
    const trimmedValue = value.trim()
    
    if (trimmedValue.startsWith('/')) {
      if (!detectAndSwitchScene(trimmedValue)) {
        // If no scene detected, stay in current scene
      }
    } else if (trimmedValue === '') {
      setCurrentScene('default')
    } else {
      // Regular search
      setCurrentScene('search')
    }
  }, [detectAndSwitchScene])

  // Determine if palette should be expanded
  const shouldExpand = currentScene !== 'default' || searchTerm.trim() !== ''

  // Don't render if not open
  if (!commandPaletteOpen) return null

  const getSceneName = useCallback((scene: SceneType): string => {
    const sceneNames: Record<SceneType, string> = {
      'default': t('ui:commandPalette.sceneDefault'),
      'ai': t('ui:commandPalette.sceneAI'),
      'search': t('ui:commandPalette.sceneSearch'),
      'template': t('ui:commandPalette.sceneTemplate'),
      'workflow': t('ui:commandPalette.sceneWorkflow'),
      'settings': t('ui:commandPalette.sceneSettings'),
      'help': t('ui:commandPalette.sceneHelp')
    }
    return sceneNames[scene] || sceneNames.default
  }, [t])

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
            createTaskAtCenter()
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
      if (currentScene !== 'default' && currentScene !== 'search') {
        setFilteredGroups([])
        return
      }

      if (!searchTerm || currentScene === 'default') {
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
  }, [searchTerm, tasks, t, currentScene])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        
        // In AI scene, return to main input instead of closing
        if (currentScene === 'ai') {
          setCurrentScene('default')
          setSearchTerm('')
          setTimeout(() => inputRef.current?.focus(), 100)
          return
        }
        
        // In other scenes, close the palette
        handleClose()
        return
      }

      if (currentScene === 'ai') {
        // Let AI scene handle its own keyboard events (except Escape)
        return
      }

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
      }
    },
    [filteredGroups, selectedIndex, handleClose, currentScene, setCurrentScene, setSearchTerm]
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

  // Don't render if not open
  if (!commandPaletteOpen) return null

  const sendChatMessage = (message: string) => {
    if (!message.trim()) return
    
    setChatMessages(prev => [
      ...prev,
      { type: 'user', content: message },
      { type: 'assistant', content: t('ui:commandPalette.aiResponse', { query: message }) }
    ])
  }

  const renderScene = () => {
    switch (currentScene) {
      case 'ai':
        return (
          <div className="ai-scene">
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.type}`}>
                  {msg.content}
                </div>
              ))}
            </div>
            <input
              ref={chatInputRef}
              type="text"
              className="chat-input"
              placeholder={t('ui:commandPalette.aiInputPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendChatMessage(e.currentTarget.value)
                  e.currentTarget.value = ''
                } else if (e.key === 'Escape') {
                  // Return to main input instead of closing
                  setCurrentScene('default')
                  setSearchTerm('')
                  setTimeout(() => inputRef.current?.focus(), 100)
                }
              }}
            />
          </div>
        )

      case 'search':
        return (
          <div className="search-scene">
            <div className="search-results">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="search-result">
                  <div className="result-title">
                    {renderHighlightedText(task.title, searchTerm)}
                  </div>
                  <div className="result-path">{t('ui:commandPalette.canvasPath')}</div>
                  <div className="result-preview">
                    {renderHighlightedText(task.description || '', searchTerm)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'template':
        return (
          <div className="template-scene">
            <div className="template-categories">
              <div className="category-tag active">{t('ui:commandPalette.templateAll')}</div>
              <div className="category-tag">{t('ui:commandPalette.templateProject')}</div>
              <div className="category-tag">{t('ui:commandPalette.templateDev')}</div>
              <div className="category-tag">{t('ui:commandPalette.templateDesign')}</div>
            </div>
            <div className="template-grid">
              <div className="template-card">
                <div className="template-title">{t('ui:commandPalette.templateAgile')}</div>
                <div className="template-description">{t('ui:commandPalette.templateAgileDesc')}</div>
                <div className="template-meta">
                  <span>12 {t('ui:commandPalette.tasks')}</span>
                  <span>2-3 {t('ui:commandPalette.weeks')}</span>
                </div>
              </div>
              <div className="template-card">
                <div className="template-title">{t('ui:commandPalette.templateRelease')}</div>
                <div className="template-description">{t('ui:commandPalette.templateReleaseDesc')}</div>
                <div className="template-meta">
                  <span>18 {t('ui:commandPalette.tasks')}</span>
                  <span>4-6 {t('ui:commandPalette.weeks')}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'workflow':
        return (
          <div className="workflow-scene">
            <div className="workflow-list">
              <div className="workflow-item">
                <div className="workflow-icon">🔄</div>
                <div className="workflow-content">
                  <div className="workflow-title">{t('ui:commandPalette.workflowDeploy')}</div>
                  <div className="workflow-description">{t('ui:commandPalette.workflowDeployDesc')}</div>
                </div>
                <div className="workflow-status">{t('ui:commandPalette.workflowReady')}</div>
              </div>
              <div className="workflow-item">
                <div className="workflow-icon">📊</div>
                <div className="workflow-content">
                  <div className="workflow-title">{t('ui:commandPalette.workflowReport')}</div>
                  <div className="workflow-description">{t('ui:commandPalette.workflowReportDesc')}</div>
                </div>
                <div className="workflow-status">{t('ui:commandPalette.workflowReady')}</div>
              </div>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="settings-scene">
            <div className="settings-group">
              <div className="settings-group-title">{t('ui:commandPalette.settingsUI')}</div>
              <div className="setting-item">
                <div className="setting-label">{t('ui:commandPalette.settingsDarkMode')}</div>
                <div className="setting-toggle active"></div>
              </div>
              <div className="setting-item">
                <div className="setting-label">{t('ui:commandPalette.settingsGlass')}</div>
                <div className="setting-toggle active"></div>
              </div>
            </div>
            <div className="settings-group">
              <div className="settings-group-title">{t('ui:commandPalette.settingsAI')}</div>
              <div className="setting-item">
                <div className="setting-label">{t('ui:commandPalette.settingsSmartSuggestions')}</div>
                <div className="setting-toggle active"></div>
              </div>
            </div>
          </div>
        )

      case 'help':
        return (
          <div className="help-scene">
            <div className="help-content">
              <div className="help-section">
                <div className="help-title">{t('ui:commandPalette.helpShortcuts')}</div>
                <div className="help-shortcuts">
                  <div className="shortcut-item">
                    <div className="shortcut-description">{t('ui:commandPalette.helpOpenPalette')}</div>
                    <div className="shortcut-keys">⌘K</div>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-description">{t('ui:commandPalette.helpClosePalette')}</div>
                    <div className="shortcut-keys">Esc</div>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-description">{t('ui:commandPalette.helpNavigation')}</div>
                    <div className="shortcut-keys">↑↓</div>
                  </div>
                </div>
              </div>
              <div className="help-section">
                <div className="help-title">{t('ui:commandPalette.helpScenes')}</div>
                <div className="help-shortcuts">
                  <div className="shortcut-item">
                    <div className="shortcut-description">{t('ui:commandPalette.sceneAI')}</div>
                    <div className="shortcut-keys">/ai</div>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-description">{t('ui:commandPalette.sceneSearch')}</div>
                    <div className="shortcut-keys">/search</div>
                  </div>
                  <div className="shortcut-item">
                    <div className="shortcut-description">{t('ui:commandPalette.sceneTemplate')}</div>
                    <div className="shortcut-keys">/template</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
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
        )
    }
  }

  return (
    <div className="backdrop" onClick={handleClose}>
      <div className={`command-palette ${isClosing ? 'closing' : isEntering ? '' : 'active'} ${shouldExpand ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="command-input-container">
          <input
            type="text"
            className="command-input"
            placeholder={t('ui:commandPalette.placeholder')}
            value={searchTerm}
            onChange={(e) => handleInput(e.target.value)}
            ref={inputRef}
            aria-label={t('ui:commandPalette.placeholder')}
          />
          {currentScene !== 'default' && (
            <div className="scene-indicator visible">
              {getSceneName(currentScene)}
            </div>
          )}
        </div>

        {shouldExpand && (
          <>
            {currentScene !== 'default' && (
              <div className="expandable-content">
                {renderScene()}
              </div>
            )}

            {currentScene === 'default' && renderScene()}

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
          </>
        )}
      </div>
    </div>
  )
}

export default CommandPalette