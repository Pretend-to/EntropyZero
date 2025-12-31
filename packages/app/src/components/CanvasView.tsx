import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useI18n } from '../hooks/useI18n'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useTaskCreator } from '../hooks/useTaskCreator'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { useConnectionCreator } from '../hooks/useConnectionCreator'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { TASK_NODE_WIDTH, TASK_NODE_HEIGHT } from '../hooks/useVirtualizedCanvas'
import TaskNode from './TaskNode'
import ConnectionLine from './ConnectionLine'
import ConnectionPreview from './ConnectionPreview'
import ConnectionContextMenu from './ConnectionContextMenu'
import ValidationMessage from './ValidationMessage'
import FloatingToolbar from './FloatingToolbar'
import ZoomControls from './ZoomControls'
import DataManager from './DataManager'
import type { Position, CanvasState, Connection } from '../types'
import './CanvasView.css'

const CanvasView: React.FC = () => {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLDivElement>(null)
  const { tasks, connections, selectedTaskIds, selectedConnectionIds, moveTask, clearSelection, selectTask, selectMultipleTasks, selectConnection, clearConnectionSelection, updateConnection, removeConnection } = useTaskStore()
  const { createTaskAtPosition } = useTaskCreator()
  const { undo, redo } = useUndoRedo()
  
  // 连接创建功能
  const {
    creationState,
    validationMessage,
    startConnection,
    updateConnectionPreview,
    completeConnection,
    cancelConnection,
  } = useConnectionCreator()
  
  // 连接线右键菜单状态
  const [connectionContextMenu, setConnectionContextMenu] = useState<{
    connection: Connection
    position: Position
  } | null>(null)
  
  // 框选状态
  const [selectionBox, setSelectionBox] = useState<{
    isSelecting: boolean
    startPos: Position
    currentPos: Position
  }>({
    isSelecting: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
  })

  // 启用键盘快捷键
  useKeyboardShortcuts()
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedTaskIds: [],
    isDragging: false,
  })

  // 数据管理面板开关
  const [showDataManager, setShowDataManager] = useState(false)

  // 连接创建处理
  const handleConnectionStart = useCallback((
    taskId: string,
    connectionPoint: 'top' | 'right' | 'bottom' | 'left',
    position: Position
  ) => {
    console.log('开始连接创建:', taskId, connectionPoint, position)
    startConnection(taskId, connectionPoint, position)
  }, [startConnection])

  const handleConnectionEnd = useCallback((
    taskId: string,
    connectionPoint: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    console.log('尝试完成连接:', taskId, connectionPoint, '当前状态:', creationState.isCreating)
    if (creationState.isCreating && creationState.sourceTaskId) {
      const success = completeConnection(taskId, connectionPoint, 'strong')
      console.log('连接创建结果:', success)
      
      if (success) {
        console.log('连接创建成功，当前连接数量:', connections.length)
      }
    }
  }, [creationState.isCreating, creationState.sourceTaskId, completeConnection, connections.length])

  // 连接线选择处理
  const handleConnectionSelect = useCallback((connectionId: string) => {
    console.log('选择连接线:', connectionId)
    selectConnection(connectionId, false)
  }, [selectConnection])

  // 连接线右键菜单处理
  const handleConnectionContextMenu = useCallback((connectionId: string, position: Position) => {
    const connection = connections.find(c => c.id === connectionId)
    if (connection) {
      console.log('显示连接线右键菜单:', connectionId, position)
      setConnectionContextMenu({ connection, position })
      // 选中这个连接线
      selectConnection(connectionId, false)
    }
  }, [connections, selectConnection])

  // 关闭连接线右键菜单
  const handleCloseConnectionContextMenu = useCallback(() => {
    setConnectionContextMenu(null)
  }, [])

  // 删除连接线
  const handleDeleteConnection = useCallback((connectionId: string) => {
    console.log('删除连接线:', connectionId)
    removeConnection(connectionId)
  }, [removeConnection])

  // 更改连接线类型
  const handleChangeConnectionType = useCallback((connectionId: string, type: Connection['type']) => {
    console.log('更改连接线类型:', connectionId, type)
    updateConnection(connectionId, { type })
  }, [updateConnection])

  // 使用新的画布渲染器
  const {
    visibleTasks,
    visibleConnections,
    renderLayers,
    getAllTasksBounds,
    measureRenderTime,
  } = useCanvasRenderer(tasks, connections, canvasState, canvasRef)
  
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    dragTarget: string | null
    startPos: Position
    startTaskPos: Position
  }>({
    isDragging: false,
    dragTarget: null,
    startPos: { x: 0, y: 0 },
    startTaskPos: { x: 0, y: 0 },
  })

  // 稳定排序的可见任务，确保拖拽中的节点在最上层
  const sortedVisibleTasks = useMemo(() => {
    if (!visibleTasks) return []
    
    return [...visibleTasks].sort((a, b) => {
      // 确保拖拽中的节点始终在最上层
      const aIsDragging = dragState.isDragging && dragState.dragTarget === a.id
      const bIsDragging = dragState.isDragging && dragState.dragTarget === b.id
      
      if (aIsDragging && !bIsDragging) return 1
      if (!aIsDragging && bIsDragging) return -1
      
      // 其他节点保持稳定顺序（按ID排序以确保一致性）
      return a.id.localeCompare(b.id)
    })
  }, [visibleTasks, dragState.isDragging, dragState.dragTarget])

  // 画布平移状态
  const [panState, setPanState] = useState<{
    isPanning: boolean
    startPos: Position
    startPan: Position
  }>({
    isPanning: false,
    startPos: { x: 0, y: 0 },
    startPan: { x: 0, y: 0 },
  })

  // 坐标转换函数（暂时保留，可能在未来使用）
  // const screenToCanvas = useCallback((screenPos: Position): Position => {
  //   return {
  //     x: (screenPos.x - canvasState.pan.x) / canvasState.zoom,
  //     y: (screenPos.y - canvasState.pan.y) / canvasState.zoom,
  //   }
  // }, [canvasState.pan, canvasState.zoom])

  // 缩放控制
  const handleZoom = useCallback((delta: number, center?: Position) => {
    setCanvasState(prev => {
      const newZoom = Math.max(0.1, Math.min(5, prev.zoom + delta))
      
      if (center && newZoom !== prev.zoom) {
        // 以指定点为中心缩放
        const zoomRatio = newZoom / prev.zoom
        const newPan = {
          x: center.x - (center.x - prev.pan.x) * zoomRatio,
          y: center.y - (center.y - prev.pan.y) * zoomRatio,
        }
        return { ...prev, zoom: newZoom, pan: newPan }
      }
      
      return { ...prev, zoom: newZoom }
    })
  }, [])

  // 适应画布 - 使用优化的边界计算
  const fitToCanvas = useCallback(() => {
    const bounds = getAllTasksBounds()
    if (!bounds) return
    
    const padding = 100
    const contentWidth = bounds.right - bounds.left + padding * 2
    const contentHeight = bounds.bottom - bounds.top + padding * 2
    
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.clientWidth
      const containerHeight = canvasRef.current.clientHeight
      
      const scaleX = containerWidth / contentWidth
      const scaleY = containerHeight / contentHeight
      const newZoom = Math.min(scaleX, scaleY, 1)
      
      const newPan = {
        x: (containerWidth - contentWidth * newZoom) / 2 - (bounds.left - padding) * newZoom,
        y: (containerHeight - contentHeight * newZoom) / 2 - (bounds.top - padding) * newZoom,
      }
      
      setCanvasState(prev => ({ ...prev, zoom: newZoom, pan: newPan }))
    }
  }, [getAllTasksBounds])

  // 鼠标事件处理 - 使用事件委托查找任务
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 只处理左键点击，忽略右键和中键
    if (e.button !== 0) {
      return
    }
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    
    // 检查是否点击了连接点
    const target = e.target as HTMLElement
    if (target.classList.contains('connection-point')) {
      // 如果点击的是连接点，不处理任务拖拽，让连接点处理
      return
    }
    
    // 检查是否点击了按钮或其他交互元素
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // 如果点击的是按钮等交互元素，不处理拖拽
      return
    }
    
    // 检查是否点击了可编辑的文本区域
    const isEditableText = target.classList.contains('task-node__title') || 
                          target.classList.contains('task-node__description') ||
                          target.classList.contains('task-node__description-placeholder')
    
    if (isEditableText) {
      // 如果点击的是可编辑文本，不阻止默认行为，让编辑功能正常工作
      return
    }
    
    // 只有在非编辑区域才阻止默认行为
    e.preventDefault()
    
    // 使用事件委托查找点击的任务节点
    let targetElement: HTMLElement | null = e.target as HTMLElement
    let clickedTaskId: string | null = null

    while (targetElement && targetElement !== canvasRef.current) {
      if (targetElement.dataset.taskId) {
        clickedTaskId = targetElement.dataset.taskId
        break
      }
      targetElement = targetElement.parentElement
    }

    if (clickedTaskId) {
      // 找到对应的任务
      const clickedTask = tasks.find(t => t.id === clickedTaskId)
      if (clickedTask) {
        // 关闭连接线右键菜单
        if (connectionContextMenu) {
          setConnectionContextMenu(null)
        }
        
        // 处理任务选择
        const isMultiSelect = e.ctrlKey || e.metaKey // Ctrl/Cmd + 点击多选
        
        if (isMultiSelect) {
          // 多选模式：切换选择状态
          selectTask(clickedTaskId, true)
        } else {
          // 单选模式：如果任务未选中，则选中它；如果已选中，保持选中状态准备拖拽
          if (!selectedTaskIds.includes(clickedTaskId)) {
            selectTask(clickedTaskId, false)
          }
        }
        
        // 开始拖拽任务（只有在非多选模式下才拖拽）
        if (!isMultiSelect) {
          setDragState({
            isDragging: true,
            dragTarget: clickedTaskId,
            startPos: screenPos,
            startTaskPos: clickedTask.position,
          })
        }
      }
    } else {
      // 点击空白区域
      const isMultiSelect = e.ctrlKey || e.metaKey
      
      // 关闭连接线右键菜单
      if (connectionContextMenu) {
        setConnectionContextMenu(null)
      }
      
      if (!isMultiSelect) {
        // 非多选模式：清除选择并开始平移或框选
        clearSelection()
        clearConnectionSelection() // 同时清除连接选择
      }
      
      // 检查是否按住Shift键进行框选
      if (e.shiftKey) {
        // 开始框选
        setSelectionBox({
          isSelecting: true,
          startPos: screenPos,
          currentPos: screenPos,
        })
      } else {
        // 开始平移画布
        setPanState({
          isPanning: true,
          startPos: screenPos,
          startPan: canvasState.pan,
        })
      }
    }
  }, [tasks, canvasState.pan, clearSelection, selectedTaskIds, selectTask, connectionContextMenu])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    // 更新连接预览
    if (creationState.isCreating) {
      // 将鼠标位置转换为SVG坐标系
      const svgContainer = document.querySelector('.connections-layer') as HTMLElement
      const svgRect = svgContainer?.getBoundingClientRect()
      
      const svgMousePos = {
        x: e.clientX - (svgRect?.left || 0),
        y: e.clientY - (svgRect?.top || 0)
      }
      
      updateConnectionPreview(svgMousePos)
    }

    if (selectionBox.isSelecting) {
      // 更新框选区域
      setSelectionBox(prev => ({
        ...prev,
        currentPos: screenPos,
      }))
    } else if (dragState.isDragging && dragState.dragTarget) {
      // 拖拽任务 - 考虑画布的变换
      const deltaX = screenPos.x - dragState.startPos.x
      const deltaY = screenPos.y - dragState.startPos.y
      
      // 将屏幕坐标的增量转换为画布坐标的增量
      const canvasDeltaX = deltaX / canvasState.zoom
      const canvasDeltaY = deltaY / canvasState.zoom
      
      const newPosition = {
        x: dragState.startTaskPos.x + canvasDeltaX,
        y: dragState.startTaskPos.y + canvasDeltaY,
      }
      
      moveTask(dragState.dragTarget, newPosition)
    } else if (panState.isPanning) {
      // 平移画布
      const deltaX = screenPos.x - panState.startPos.x
      const deltaY = screenPos.y - panState.startPos.y
      
      setCanvasState(prev => ({
        ...prev,
        pan: {
          x: panState.startPan.x + deltaX,
          y: panState.startPan.y + deltaY,
        }
      }))
    }
  }, [dragState, panState, canvasState.zoom, moveTask, creationState.isCreating, updateConnectionPreview, selectionBox.isSelecting])

  const handleMouseUp = useCallback(() => {
    // 处理连接创建取消
    if (creationState.isCreating) {
      cancelConnection()
    }

    // 处理框选结束
    if (selectionBox.isSelecting) {
      // 计算框选区域（转换为画布坐标）
      const startCanvas = {
        x: (selectionBox.startPos.x - canvasState.pan.x) / canvasState.zoom,
        y: (selectionBox.startPos.y - canvasState.pan.y) / canvasState.zoom,
      }
      const endCanvas = {
        x: (selectionBox.currentPos.x - canvasState.pan.x) / canvasState.zoom,
        y: (selectionBox.currentPos.y - canvasState.pan.y) / canvasState.zoom,
      }
      
      // 计算选择框的边界
      const minX = Math.min(startCanvas.x, endCanvas.x)
      const maxX = Math.max(startCanvas.x, endCanvas.x)
      const minY = Math.min(startCanvas.y, endCanvas.y)
      const maxY = Math.max(startCanvas.y, endCanvas.y)
      
      // 找到在选择框内的任务
      const selectedTasks = tasks.filter(task => {
        const taskCenterX = task.position.x + 140 // 任务节点宽度的一半
        const taskCenterY = task.position.y + 80  // 任务节点高度的一半
        
        return taskCenterX >= minX && taskCenterX <= maxX &&
               taskCenterY >= minY && taskCenterY <= maxY
      })
      
      // 选中这些任务
      if (selectedTasks.length > 0) {
        selectMultipleTasks(selectedTasks.map(task => task.id))
      }
      
      // 结束框选
      setSelectionBox({
        isSelecting: false,
        startPos: { x: 0, y: 0 },
        currentPos: { x: 0, y: 0 },
      })
    }
    
    setDragState({
      isDragging: false,
      dragTarget: null,
      startPos: { x: 0, y: 0 },
      startTaskPos: { x: 0, y: 0 },
    })
    setPanState({
      isPanning: false,
      startPos: { x: 0, y: 0 },
      startPan: { x: 0, y: 0 },
    })
  }, [selectionBox, canvasState.pan, canvasState.zoom, tasks, selectMultipleTasks, creationState.isCreating, cancelConnection])

  // 使用 useEffect 添加 wheel 事件监听器以支持 preventDefault
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const center = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const delta = -e.deltaY * 0.001
      handleZoom(delta, center)
    }

    canvas.addEventListener('wheel', handleWheelEvent, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheelEvent)
  }, [handleZoom])

  // 双击创建任务 - 使用统一的任务创建逻辑
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // 检查是否双击在任务节点上，如果是则不创建新任务
    let targetElement: HTMLElement | null = e.target as HTMLElement
    while (targetElement && targetElement !== canvasRef.current) {
      if (targetElement.dataset.taskId || targetElement.classList.contains('task-node')) {
        // 双击在任务节点上，不创建新任务
        return
      }
      targetElement = targetElement.parentElement
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const canvasPos = {
      x: (screenPos.x - canvasState.pan.x) / canvasState.zoom,
      y: (screenPos.y - canvasState.pan.y) / canvasState.zoom,
    }
    
    measureRenderTime('Create Task', () => {
      const newPosition = { x: canvasPos.x - TASK_NODE_WIDTH / 2, y: canvasPos.y - TASK_NODE_HEIGHT / 2 }
      createTaskAtPosition(newPosition)
    })
  }, [canvasState.pan, canvasState.zoom, createTaskAtPosition, measureRenderTime])

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (connectionContextMenu) {
          setConnectionContextMenu(null)
        } else if (creationState.isCreating) {
          cancelConnection()
        } else {
          clearSelection()
          clearConnectionSelection()
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // 删除选中的连接线
        if (selectedConnectionIds.length > 0) {
          e.preventDefault()
          selectedConnectionIds.forEach(connectionId => {
            const { removeConnection } = useTaskStore.getState()
            removeConnection(connectionId)
          })
          console.log('删除连接线:', selectedConnectionIds)
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        // Cmd/Ctrl + Z: 撤销
        e.preventDefault()
        undo()
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        // Cmd/Ctrl + Shift + Z: 重做
        e.preventDefault()
        redo()
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        fitToCanvas()
      } else if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleZoom(0.1)
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleZoom(-0.1)
      } else if (e.key === 'i' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        // Ctrl/Cmd + Shift + I 打开数据管理面板
        e.preventDefault()
        setShowDataManager(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection, fitToCanvas, handleZoom, creationState.isCreating, cancelConnection, selectedConnectionIds, clearConnectionSelection, connectionContextMenu, undo, redo])

  return (
    <div className="canvas-view">
      <div
        ref={canvasRef}
        className={`canvas-container ${creationState.isCreating ? 'canvas-container--creating-connection' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => {
          console.log('CanvasView contextmenu event:', e.target)
          // 不阻止事件，让它传播到TaskNode
        }}
        style={{
          cursor: creationState.isCreating ? 'crosshair' : panState.isPanning ? 'grabbing' : dragState.isDragging ? 'move' : 'grab'
        }}
      >
        {/* 网格背景 - 根据渲染层级决定是否显示 */}
        {renderLayers.grid && (
          <div 
            className="canvas-grid"
            style={{
              backgroundSize: `${20 * canvasState.zoom}px ${20 * canvasState.zoom}px`,
              backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`,
            }}
          />
        )}
        
        {/* 连接线层 - 只渲染可见的连接线 */}
        {renderLayers.connections && (
          <svg 
            className="connections-layer"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'auto', // SVG容器可以接收事件
              zIndex: 2, // 在任务层之下
            }}
            onClick={(e) => {
              // 只有点击到SVG背景时才处理，连接线会阻止事件冒泡
              if (e.target === e.currentTarget) {
                console.log('SVG背景被点击，清除连接选择')
                clearConnectionSelection()
              }
            }}
          >
            {/* 调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <text x="10" y="20" fill="red" fontSize="12">
                连接数: {connections.length}, 可见连接数: {visibleConnections?.length || 0}, 选中连接: {selectedConnectionIds.length}
              </text>
            )}
            
            {visibleConnections && visibleConnections.map(connection => (
              <ConnectionLine
                key={connection.id}
                connection={connection}
                tasks={tasks}
                canvasState={canvasState}
                selected={selectedConnectionIds.includes(connection.id)}
                onSelect={handleConnectionSelect}
                onContextMenu={handleConnectionContextMenu}
              />
            ))}
            
            {/* 连接预览 */}
            {creationState.isCreating && (
              <ConnectionPreview
                sourcePosition={creationState.sourcePosition}
                currentPosition={creationState.currentPosition}
                canvasState={canvasState}
              />
            )}
          </svg>
        )}
        
        {/* 任务节点层 - 无限画布容器 */}
        <div 
          className="tasks-layer"
          style={{
            transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
            pointerEvents: 'none', // 容器本身不拦截事件
            zIndex: 3, // 确保在连接线层之上
          }}
        >
          {sortedVisibleTasks.map(task => (
            <TaskNode
              key={task.id}
              task={task}
              selected={selectedTaskIds.includes(task.id)}
              dragging={dragState.isDragging && dragState.dragTarget === task.id}
              showDetails={renderLayers.taskDetails}
              onSelect={() => {/* 在 mouseDown 中处理 */}}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={handleConnectionEnd}
            />
          ))}
        </div>

        {/* 选择框 */}
        {selectionBox.isSelecting && (
          <div
            className="selection-box"
            style={{
              position: 'absolute',
              left: Math.min(selectionBox.startPos.x, selectionBox.currentPos.x),
              top: Math.min(selectionBox.startPos.y, selectionBox.currentPos.y),
              width: Math.abs(selectionBox.currentPos.x - selectionBox.startPos.x),
              height: Math.abs(selectionBox.currentPos.y - selectionBox.startPos.y),
              border: '2px dashed var(--accent-primary)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          />
        )}
      </div>
      
      {/* 浮动工具栏 */}
      <FloatingToolbar />
      
      {/* 缩放控件 */}
      <ZoomControls
        zoom={canvasState.zoom}
        onZoomIn={() => handleZoom(0.1)}
        onZoomOut={() => handleZoom(-0.1)}
        onFitToCanvas={fitToCanvas}
        onResetZoom={() => setCanvasState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))}
      />
      
      {/* 操作提示 */}
      <div className="canvas-hint">
        {creationState.isCreating ? (
          <>🔗 {t('ui:canvas.dragToConnect')} • ESC {t('ui:canvas.releaseToCancel')}</>
        ) : (
          <>💡 {t('ui:canvas.hint')} • 连接验证已启用</>
        )}
      </div>
      
      {/* 数据管理面板 */}
      <DataManager 
        show={showDataManager} 
        onClose={() => setShowDataManager(false)} 
      />
      
      {/* 验证消息提示 */}
      {validationMessage && (
        <ValidationMessage
          type={validationMessage.type}
          message={validationMessage.message}
        />
      )}
      
      {/* 连接线右键菜单 */}
      {connectionContextMenu && (
        <ConnectionContextMenu
          connection={connectionContextMenu.connection}
          position={connectionContextMenu.position}
          onClose={handleCloseConnectionContextMenu}
          onDelete={() => handleDeleteConnection(connectionContextMenu.connection.id)}
          onTypeChange={(type) => handleChangeConnectionType(connectionContextMenu.connection.id, type)}
        />
      )}
    </div>
  )
}

export default CanvasView
