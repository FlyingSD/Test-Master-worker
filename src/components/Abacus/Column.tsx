import React from 'react';
import { Bead } from './Bead';
import { ColumnState } from '@/types';

interface ColumnProps {
  columnState: ColumnState;
  beadSize: number;
  beadColor: string;
  onBeadClick: (position: 'heaven' | 'earth', index?: number) => void;
  disabled?: boolean;
  ghostMode?: boolean;
  showValue?: boolean;
}

export const Column: React.FC<ColumnProps> = ({
  columnState,
  beadSize,
  beadColor,
  onBeadClick,
  disabled = false,
  ghostMode = false,
  showValue = false,
}) => {
  const { heavenBead, earthBeads, position } = columnState;

  // Calculate column value (heaven bead = 5, each earth bead = 1)
  const columnValue =
    (heavenBead.isActive ? 5 : 0) +
    earthBeads.filter((b) => b.isActive).length;

  // Column spacing
  const spacing = beadSize * 0.3;
  const barWidth = 4;
  const columnWidth = beadSize + 16;

  return (
    <div
      className="flex flex-col items-center relative"
      style={{ width: `${columnWidth}px` }}
    >
      {/* Column value display (optional) */}
      {showValue && (
        <div className="absolute -top-8 text-xs font-mono text-firefly-light">
          {columnValue}
        </div>
      )}

      {/* Heaven section (top bead) */}
      <div className="flex flex-col items-center" style={{ gap: `${spacing}px` }}>
        <Bead
          size={beadSize}
          isActive={heavenBead.isActive}
          position="heaven"
          color={beadColor}
          onClick={() => onBeadClick('heaven')}
          disabled={disabled}
          ghostMode={ghostMode}
        />

        {/* Divider bar (represents the counting bar) */}
        <div
          className="bg-ocean-dark rounded-full"
          style={{
            width: `${columnWidth - 8}px`,
            height: `${barWidth}px`,
            margin: `${spacing}px 0`,
          }}
        />
      </div>

      {/* Earth section (four beads) */}
      <div className="flex flex-col items-center" style={{ gap: `${spacing}px` }}>
        {earthBeads.map((bead, index) => (
          <Bead
            key={`earth-${index}`}
            size={beadSize}
            isActive={bead.isActive}
            position="earth"
            color={beadColor}
            onClick={() => onBeadClick('earth', index)}
            disabled={disabled}
            ghostMode={ghostMode}
          />
        ))}
      </div>

      {/* Position indicator (for debugging/learning) */}
      {showValue && (
        <div className="absolute -bottom-6 text-xs font-mono text-gray-500">
          10^{position}
        </div>
      )}
    </div>
  );
};
