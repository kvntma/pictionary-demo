import React from 'react';
import { useGame } from '../contexts/GameContext';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  const { gameState } = useGame();
  const canDraw = !gameState.currentWord || gameState.currentPlayer?.is_drawing;

  if (!canDraw) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Colors</h2>
      <div className="flex gap-2 flex-wrap">
        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map(c => (
          <button
            key={c}
            className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              currentColor === c ? 'border-blue-500' : 'border-gray-300'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>
    </div>
  );
};
