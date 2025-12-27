import React from 'react';
import './RainbowCard.css';

interface RainbowCardProps {
  children?: React.ReactNode;
  width?: string;
  height?: string;
  borderRadius?: string;
  glowDepth?: number;
  speed?: string;
  className?: string;
}

const RainbowCard: React.FC<RainbowCardProps> = ({
  children,
  width = '380px',
  height = '260px',
  borderRadius = '20px',
  glowDepth = 25,
  speed = '4s',
  className = "",
}) => {
  
  // 将 Props 映射为 CSS 变量
  const dynamicVars = {
    '--rc-width': width,
    '--rc-height': height,
    '--rc-border-radius': borderRadius,
    '--rc-glow-depth': `${glowDepth}px`,
    '--rc-speed': speed,
  } as React.CSSProperties;

  return (
    <div 
      className={`rainbow-card-root ${className}`} 
      style={dynamicVars}
    >
      {/* 物理晕染条 */}
      <div className="rc-glow-edge rc-edge-t" />
      <div className="rc-glow-edge rc-edge-r" />
      <div className="rc-glow-edge rc-edge-b" />
      <div className="rc-glow-edge rc-edge-l" />

      <div className="rc-inner-content">
        {children}
      </div>
    </div>
  );
};

export default RainbowCard;
