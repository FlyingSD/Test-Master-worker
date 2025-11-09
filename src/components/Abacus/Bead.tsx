import React from 'react';
import { motion } from 'framer-motion';

interface BeadProps {
  size: number;
  isActive: boolean;
  position: 'heaven' | 'earth';
  color: string;
  onClick: () => void;
  disabled?: boolean;
  ghostMode?: boolean;
}

export const Bead: React.FC<BeadProps> = ({
  size,
  isActive,
  position: _position,
  color,
  onClick,
  disabled = false,
  ghostMode = false,
}) => {
  const beadStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <motion.div
      className={`
        rounded-full cursor-pointer transition-all duration-300 relative
        ${isActive ? 'firefly-glow' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}
        ${ghostMode ? 'opacity-30' : ''}
      `}
      style={{
        ...beadStyle,
        backgroundColor: isActive ? color : '#2A4A4D',
        border: isActive ? `2px solid ${color}` : '2px solid #3A9B8A',
      }}
      onClick={!disabled ? onClick : undefined}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      animate={
        isActive
          ? {
              boxShadow: [
                `0 0 10px ${color}`,
                `0 0 20px ${color}`,
                `0 0 10px ${color}`,
              ],
            }
          : {}
      }
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
    >
      {/* Inner glow effect when active */}
      {isActive && !ghostMode && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          }}
        />
      )}
    </motion.div>
  );
};
