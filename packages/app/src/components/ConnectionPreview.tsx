import React from 'react'
import { generateBezierPath } from '../utils/coordinateSystem'
import type { Position } from '../types'

interface ConnectionPreviewProps {
  sourcePosition: Position // SVG坐标系中的源连接点位置
  currentPosition: Position // SVG坐标系中的当前鼠标位置
  canvasState: {
    zoom: number
    pan: Position
  }
}

const ConnectionPreview: React.FC<ConnectionPreviewProps> = ({
  sourcePosition,
  currentPosition,
  canvasState: _ // 不再需要canvasState，因为都是SVG坐标
}) => {
  // 两个位置都已经是SVG坐标，直接使用
  const sourceScreenPos = sourcePosition
  const endScreenPos = currentPosition

  // 生成贝塞尔曲线路径
  const pathData = generateBezierPath(sourceScreenPos, endScreenPos)

  return (
    <g className="connection-preview">
      {/* 调试信息 - 显示连接点位置 */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <circle cx={sourceScreenPos.x} cy={sourceScreenPos.y} r="4" fill="green" opacity="0.8" />
          <circle cx={endScreenPos.x} cy={endScreenPos.y} r="3" fill="orange" opacity="0.8" />
        </>
      )}
      
      <path
        d={pathData}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth="3"
        strokeDasharray="8,4"
        opacity="0.8"
        className="connection-preview-path"
      />
      
      {/* 起始点 - 在连接点位置 */}
      <circle
        cx={sourceScreenPos.x}
        cy={sourceScreenPos.y}
        r="6"
        fill="var(--accent-primary)"
        opacity="1"
        stroke="var(--bg-secondary)"
        strokeWidth="2"
      />
      
      {/* 结束点 - 跟随鼠标 */}
      <circle
        cx={endScreenPos.x}
        cy={endScreenPos.y}
        r="4"
        fill="var(--accent-primary)"
        opacity="0.7"
      />
    </g>
  )
}

export default ConnectionPreview