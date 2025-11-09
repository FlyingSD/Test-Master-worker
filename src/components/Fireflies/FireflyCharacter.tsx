import React from 'react';
import { motion } from 'framer-motion';
import { FireflyCharacterProps } from '@/types';
import { FIREFLY_HEROES } from '@/utils/constants';

const sizeMap = {
  sm: { emoji: 'text-3xl', container: 'w-16 h-16' },
  md: { emoji: 'text-5xl', container: 'w-24 h-24' },
  lg: { emoji: 'text-7xl', container: 'w-32 h-32' },
  xl: { emoji: 'text-9xl', container: 'w-40 h-40' },
};

export const FireflyCharacter: React.FC<FireflyCharacterProps> = ({
  number,
  size = 'md',
  animate = true,
  isActive = false,
}) => {
  const hero = FIREFLY_HEROES[number];
  const sizeClasses = sizeMap[size];

  if (!hero) {
    console.error(`Firefly hero not found for number: ${number}`);
    return null;
  }

  return (
    <motion.div
      className={`
        ${sizeClasses.container}
        flex flex-col items-center justify-center
        relative cursor-pointer
      `}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      whileHover={animate ? { scale: 1.1 } : {}}
      whileTap={animate ? { scale: 0.9 } : {}}
    >
      {/* Glow effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `0 0 20px ${hero.color}`,
              `0 0 40px ${hero.color}`,
              `0 0 20px ${hero.color}`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Firefly emoji */}
      <motion.div
        className={`${sizeClasses.emoji} ${isActive ? 'firefly-glow-strong' : 'firefly-glow'}`}
        animate={
          animate
            ? {
                y: [-5, 5, -5],
                rotate: [-5, 5, -5],
              }
            : {}
        }
        transition={{
          duration: 3 + number * 0.2, // Different speed for each firefly
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          filter: `drop-shadow(0 0 10px ${hero.color})`,
        }}
      >
        {hero.emoji}
      </motion.div>

      {/* Name label */}
      <motion.div
        className="mt-2 text-sm font-semibold text-center"
        style={{ color: hero.color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {hero.name}
      </motion.div>

      {/* Number badge */}
      <motion.div
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
        style={{
          backgroundColor: hero.color,
          color: '#1D3234',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        {number}
      </motion.div>

      {/* Active pulse effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-4"
          style={{ borderColor: hero.color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
};
