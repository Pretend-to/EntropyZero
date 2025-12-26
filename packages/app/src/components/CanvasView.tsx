import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { useI18n } from '../hooks/useI18n'
import TaskNode from './TaskNode'
import ConnectionLine from './ConnectionLine'
import FloatingToolbar from './FloatingToolbar'
import ZoomControls from './ZoomControls'
import type { Position, CanvasState } from '../types'
import './CanvasView.css'

const CanvasView: React.FC = () => {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLDivElement>(null)
  const { tasks, connections, selectedTaskIds, moveTask, addTask, clearSelection } = useTaskStore()
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedTaskIds: [],
    isDragging: false,
  })
  
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

  // 坐标转换函数
  const screenToCanvas = useCallback((screenPos: Position): Position => {
    return {
      x: (screenPos.x - canvasState.pan.x) / canvasState.zoom,
      y: (screenPos.y - canvasState.pan.y) / canvasState.zoom,
    }
  }, [canvasState.pan, canvasState.zoom])

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

  // 适应画布
  const fitToCanvas = useCallback(() => {
    if (tasks.length === 0) return
    
    const padding = 100
    const minX = Math.min(...tasks.map(t => t.position.x)) - padding
    const maxX = Math.max(...tasks.map(t => t.position.x)) + padding
    const minY = Math.min(...tasks.map(t => t.position.y)) - padding
    const maxY = Math.max(...tasks.map(t => t.position.y)) + padding
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.clientWidth
      const containerHeight = canvasRef.current.clientHeight
      
      const scaleX = containerWidth / contentWidth
      const scaleY = containerHeight / contentHeight
      const newZoom = Math.min(scaleX, scaleY, 1)
      
      const newPan = {
        x: (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom,
        y: (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom,
      }
      
      setCanvasState(prev => ({ ...prev, zoom: newZoom, pan: newPan }))
    }
  }, [tasks])

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent text selection during drag
    e.preventDefault()

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    
    // Check if clicked on a TaskNode using event delegation
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
      // Start dragging a task
      const task = tasks.find(t => t.id === clickedTaskId)
      if (task) {
        setDragState({
          isDragging: true,
          dragTarget: clickedTaskId,
          startPos: screenPos,
          startTaskPos: task.position,
        })
        // Optionally select the task on click, if not already selected
        if (!selectedTaskIds.includes(clickedTaskId)) {
          clearSelection() // Clear previous selection if not multi-selecting
          // selectTask(clickedTaskId) // Or implement single/multi-select logic
        }
      }
    } else {
      // Start panning the canvas
      setPanState({
        isPanning: true,
        startPos: screenPos,
        startPan: canvasState.pan,
      })
      clearSelection() // Clear selection when clicking on empty canvas
    }
  }, [tasks, canvasState.pan, clearSelection, selectedTaskIds])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    if (dragState.isDragging && dragState.dragTarget) {
      // 拖拽任务
      const deltaX = screenPos.x - dragState.startPos.x
      const deltaY = screenPos.y - dragState.startPos.y
      
      const newPosition = {
        x: dragState.startTaskPos.x + deltaX / canvasState.zoom,
        y: dragState.startTaskPos.y + deltaY / canvasState.zoom,
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
  }, [dragState, panState, canvasState.zoom, moveTask])

  const handleMouseUp = useCallback(() => {
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
  }, [])

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const center = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const delta = -e.deltaY * 0.001
    handleZoom(delta, center)
  }, [handleZoom])

  // 双击创建任务
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const canvasPos = screenToCanvas(screenPos)
    
    addTask({
      title: t('task.placeholders.taskTitle'),
      status: 'todo',
      priority: 'medium',
      position: { x: canvasPos.x - 100, y: canvasPos.y - 60 }, // 居中任务节点
      tags: [],
    })
  }, [screenToCanvas, addTask, t])

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        fitToCanvas()
      } else if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleZoom(0.1)
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleZoom(-0.1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection, fitToCanvas, handleZoom])

  return (
    <div className="canvas-view">
      <div
        ref={canvasRef}
        className="canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: panState.isPanning ? 'grabbing' : dragState.isDragging ? 'move' : 'grab'
        }}
      >
        {/* 网格背景 */}
        <div 
          className="canvas-grid"
          style={{
            backgroundSize: `${20 * canvasState.zoom}px ${20 * canvasState.zoom}px`,
            backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`,
          }}
        />
        
        {/* 连接线层 */}
        <svg className="connections-layer">
          {connections.map(connection => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              tasks={tasks}
              canvasState={canvasState}
            />
          ))}
        </svg>
        
        {/* 任务节点层 */}
        <div 
          className="tasks-layer"
          style={{
            transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
          }}
        >
          {tasks.map(task => (
            <TaskNode
              key={task.id}
              task={task}
              selected={selectedTaskIds.includes(task.id)}
              dragging={dragState.isDragging && dragState.dragTarget === task.id}
              onSelect={() => {/* 在 mouseDown 中处理 */}}
            />
          ))}
        </div>
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
        💡 {t('ui:canvas.hint')}
      </div>
    </div>
  )
}

export default CanvasView
