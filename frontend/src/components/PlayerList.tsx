import React from 'react';
import { useGame } from '../contexts/GameContext';

const WINNING_SCORE = 5;

export const PlayerList: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Players</h2>
      <div className="space-y-2">
        {gameState.players.map(player => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-2 rounded-md ${
              player.id === gameState.currentPlayer?.id ? 'bg-blue-50 border border-blue-200' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {player.name}
                {player.id === gameState.currentPlayer?.id && (
                  <span className="ml-2 text-sm text-blue-600">(You)</span>
                )}
                {player.is_drawing && (
                  <span className="ml-2 text-sm text-purple-600">(Drawer)</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${
                  player.score >= WINNING_SCORE ? 'text-green-600 font-bold' : 'text-gray-500'
                }`}
              >
                Score: {player.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
