import React from 'react';
import { useGame } from '../contexts/GameContext';

export const GameInfo: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Game Info</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600">Time Remaining</h3>
          <div className="text-2xl font-bold text-center mt-1">{gameState.timeRemaining}s</div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-600">Current Word</h3>
          <div className="text-xl font-bold text-center mt-1">
            {gameState.currentPlayer?.is_drawing ? gameState.currentWord : '?????'}
          </div>
        </div>
      </div>
    </div>
  );
};
