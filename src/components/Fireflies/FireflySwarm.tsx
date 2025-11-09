import React from 'react';
import { motion } from 'framer-motion';
import { FireflyCharacter } from './FireflyCharacter';

interface FireflySwarmProps {
  activeNumbers?: number[]; // Highlight specific fireflies
  showAll?: boolean; // Show all 1-10 or just a selection
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onFireflyClick?: (number: number) => void;
}

export const FireflySwarm: React.FC<FireflySwarmProps> = ({
  activeNumbers = [],
  showAll = true,
  size = 'md',
  onFireflyClick,
}) => {
  const numbers = showAll ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 2, 3, 4, 5];

  return (
    <div className="relative">
      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-display font-bold text-center mb-8 text-firefly-light"
      >
        Запознай се с нашите светулки! ✨
      </motion.h3>

      {/* Firefly grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 max-w-4xl mx-auto">
        {numbers.map((num, index) => (
          <motion.div
            key={num}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onFireflyClick?.(num)}
          >
            <FireflyCharacter
              number={num as any}
              size={size}
              animate={true}
              isActive={activeNumbers.includes(num)}
            />
          </motion.div>
        ))}
      </div>

      {/* Special note for Петра */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-8 text-ocean-light"
      >
        <p className="text-sm">
          ⭐ <strong>Петра</strong> е нашата специална учителка - тя ни учи на малките приятели!
        </p>
        <p className="text-sm mt-2">
          ⭐⭐ <strong>Десето</strong> е двойната звезда - майсторът на големите приятели!
        </p>
      </motion.div>
    </div>
  );
};
