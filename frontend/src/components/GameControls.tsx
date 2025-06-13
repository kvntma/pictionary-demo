import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';

export const GameControls: React.FC = () => {
  const { gameState, startGame, leaveRoom, endGame, incrementScore } = useGame();

  return (
    <div className="flex gap-2">
      {!gameState.currentWord && gameState.players.length >= 2 && (
        <Button onClick={startGame} variant="default">
          Start Game
        </Button>
      )}
      <Button onClick={leaveRoom} variant="secondary">
        Leave Room
      </Button>
      <Button onClick={endGame} variant="destructive">
        End Game
      </Button>
      <Button onClick={incrementScore} variant="outline" className="text-xs">
        +1 Score
      </Button>
    </div>
  );
};
