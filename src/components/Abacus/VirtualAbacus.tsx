import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Column } from './Column';
import { AbacusState, ColumnState, BeadState, AbacusProps } from '@/types';
import { theme } from '@/utils/theme';

// Initialize empty column
const createEmptyColumn = (position: number): ColumnState => ({
  position,
  heavenBead: { isActive: false, position: 'heaven' },
  earthBeads: [
    { isActive: false, position: 'earth' },
    { isActive: false, position: 'earth' },
    { isActive: false, position: 'earth' },
    { isActive: false, position: 'earth' },
  ],
});

// Calculate value from abacus state
const calculateAbacusValue = (columns: ColumnState[]): number => {
  return columns.reduce((total, column) => {
    const columnValue =
      (column.heavenBead.isActive ? 5 : 0) +
      column.earthBeads.filter((b) => b.isActive).length;

    return total + columnValue * Math.pow(10, column.position);
  }, 0);
};

// Set abacus to a specific value
const setAbacusValue = (columns: ColumnState[], targetValue: number): ColumnState[] => {
  const newColumns = columns.map((_, i) => createEmptyColumn(i));
  let remainingValue = targetValue;

  // Process each column from highest to lowest
  for (let i = columns.length - 1; i >= 0; i--) {
    const placeValue = Math.pow(10, i);
    const digitValue = Math.floor(remainingValue / placeValue);
    remainingValue %= placeValue;

    if (digitValue >= 5) {
      // Activate heaven bead
      newColumns[i].heavenBead.isActive = true;
      // Activate earth beads for remainder
      const earthCount = digitValue - 5;
      for (let j = 0; j < earthCount && j < 4; j++) {
        newColumns[i].earthBeads[j].isActive = true;
      }
    } else {
      // Only activate earth beads
      for (let j = 0; j < digitValue && j < 4; j++) {
        newColumns[i].earthBeads[j].isActive = true;
      }
    }
  }

  return newColumns;
};

export const VirtualAbacus: React.FC<AbacusProps> = ({
  columns = 5,
  beadSize = 32,
  showValue = true,
  interactive = true,
  ghostMode = false,
  onValueChange,
  targetValue,
}) => {
  // Initialize abacus state
  const [abacusState, setAbacusState] = useState<AbacusState>(() => ({
    columns: Array.from({ length: columns }, (_, i) => createEmptyColumn(i)),
    displayValue: 0,
  }));

  // Update display value when targetValue changes
  useEffect(() => {
    if (targetValue !== undefined) {
      const newColumns = setAbacusValue(abacusState.columns, targetValue);
      setAbacusState({
        columns: newColumns,
        displayValue: targetValue,
      });
    }
  }, [targetValue]);

  // Handle bead click
  const handleBeadClick = useCallback(
    (columnIndex: number, position: 'heaven' | 'earth', beadIndex?: number) => {
      if (!interactive) return;

      setAbacusState((prev) => {
        const newColumns = [...prev.columns];
        const column = { ...newColumns[columnIndex] };

        if (position === 'heaven') {
          // Toggle heaven bead
          column.heavenBead = {
            ...column.heavenBead,
            isActive: !column.heavenBead.isActive,
          };
        } else if (position === 'earth' && beadIndex !== undefined) {
          // Toggle earth bead
          const newEarthBeads = [...column.earthBeads];
          newEarthBeads[beadIndex] = {
            ...newEarthBeads[beadIndex],
            isActive: !newEarthBeads[beadIndex].isActive,
          };
          column.earthBeads = newEarthBeads as [BeadState, BeadState, BeadState, BeadState];
        }

        newColumns[columnIndex] = column;
        const newValue = calculateAbacusValue(newColumns);

        // Call onChange callback
        if (onValueChange) {
          onValueChange(newValue);
        }

        return {
          columns: newColumns,
          displayValue: newValue,
        };
      });

      // TODO: Play bead click sound
    },
    [interactive, onValueChange]
  );

  // Reset function
  const reset = useCallback(() => {
    setAbacusState({
      columns: Array.from({ length: columns }, (_, i) => createEmptyColumn(i)),
      displayValue: 0,
    });
    if (onValueChange) {
      onValueChange(0);
    }
  }, [columns, onValueChange]);

  return (
    <div className="flex flex-col items-center">
      {/* Display value */}
      <AnimatePresence mode="wait">
        {showValue && (
          <motion.div
            key={abacusState.displayValue}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`
              mb-8 text-5xl font-display font-bold
              ${ghostMode ? 'text-gray-600' : 'text-firefly'}
            `}
          >
            {abacusState.displayValue}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abacus frame */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: ghostMode ? 0.3 : 1, y: 0 }}
        className="card p-8"
      >
        {/* Frame title */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-ocean-light">
            Виртуален Абакус (Соробан 1:4)
          </h3>
          {ghostMode && (
            <p className="text-sm text-gray-400 mt-2">
              Режим на ментална аритметика - визуализирай в съзнанието си!
            </p>
          )}
        </div>

        {/* Columns container */}
        <div className="flex items-center justify-center gap-4 p-4 bg-forest-light rounded-lg">
          {abacusState.columns
            .slice()
            .reverse()
            .map((column, index) => {
              const actualIndex = abacusState.columns.length - 1 - index;
              return (
                <Column
                  key={actualIndex}
                  columnState={column}
                  beadSize={beadSize}
                  beadColor={theme.colors.firefly}
                  onBeadClick={(pos, beadIdx) => handleBeadClick(actualIndex, pos, beadIdx)}
                  disabled={!interactive}
                  ghostMode={ghostMode}
                  showValue={showValue}
                />
              );
            })}
        </div>

        {/* Reset button */}
        {interactive && (
          <div className="text-center mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="btn-ghost text-sm px-6 py-2"
            >
              Изчисти 🔄
            </motion.button>
          </div>
        )}

        {/* Instructions */}
        {interactive && !ghostMode && (
          <div className="mt-6 text-xs text-gray-400 text-center max-w-md">
            <p>
              💡 Кликни върху топчетата, за да промениш стойността.
            </p>
            <p className="mt-1">
              Горно топче = 5, Долно топче = 1
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Export helper functions for external use
export { calculateAbacusValue, setAbacusValue, createEmptyColumn };
