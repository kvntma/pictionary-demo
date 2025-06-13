import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { GameInfo } from './GameInfo';
import { ColorPicker } from './ColorPicker';
import { PlayerList } from './PlayerList';
import { GameControls } from './GameControls';
import { DrawingCanvas } from './DrawingCanvas';
import type { WebSocketMessage } from '../types/game';
import { websocketService } from '../services/websocket';

const WINNING_SCORE = 5;

// Add shake animation keyframes
const shakeAnimation = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes red-flash {
  0%, 100% { border-color: rgb(209 213 219); }
  50% { border-color: rgb(239 68 68); }
}
`;

export const Game: React.FC = () => {
  const { gameState, sendGuess, endGame } = useGame();
  const [currentColor, setCurrentColor] = useState('#000000');
  const [guess, setGuess] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isWrong, setIsWrong] = useState(false);

  // Add style element for shake animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = shakeAnimation;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle wrong guess animation
  React.useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'guess' && 'correct' in message.data && !message.data.correct) {
        setIsShaking(true);
        setIsWrong(true);
        setTimeout(() => {
          setIsShaking(false);
          setIsWrong(false);
        }, 1000); // Reset after 1 second
      }
    };

    const cleanup = websocketService.addMessageHandler(handleMessage);
    return cleanup;
  }, []);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;

    sendGuess(guess);
    setGuess('');
  };

  // Check for winner
  React.useEffect(() => {
    const winner = gameState.players.find(player => player.score >= WINNING_SCORE);
    if (winner) {
      toast.success(`${winner.name} wins the game! 🎉`, {
        duration: 5000,
        position: 'top-center',
      });
      // End the game after showing the toast
      setTimeout(() => {
        endGame();
      }, 5000);
    }
  }, [gameState.players, endGame]);

  // Handle correct guess
  React.useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'guess' && 'correct' in message.data && message.data.correct) {
        const guesser = gameState.players.find(p => p.id === message.data.playerId);
        if (guesser) {
          toast.success(`${guesser.name} guessed correctly! +1 point`, {
            duration: 3000,
            position: 'top-center',
          });
        }
      }
    };

    const cleanup = websocketService.addMessageHandler(handleMessage);
    return cleanup;
  }, [gameState.players]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-7xl">
        {!gameState.currentWord && (
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-blue-600 animate-pulse">Waiting Room</h2>
            <p className="text-gray-600 mt-2">
              Draw freely while waiting for the game to start! (Needs 2 players to start)
            </p>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Pictionary Game</h1>
            <p className="text-gray-600 mt-1">Room: {gameState.roomCode}</p>
            <p className="text-sm text-gray-500">First to {WINNING_SCORE} points wins!</p>
          </div>
          <GameControls />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <DrawingCanvas currentColor={currentColor} />

          <div className="space-y-6">
            <GameInfo />
            <ColorPicker currentColor={currentColor} onColorChange={setCurrentColor} />
            <PlayerList />

            <form onSubmit={handleGuess} className="space-y-2">
              {gameState.currentWord && !gameState.currentPlayer?.is_drawing && (
                <>
                  <Input
                    type="text"
                    value={guess}
                    onChange={e => setGuess(e.target.value)}
                    placeholder="Enter your guess..."
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''
                    } ${isWrong ? 'animate-[red-flash_1s_ease-in-out]' : 'border-gray-300'}`}
                    disabled={!gameState.currentWord || gameState.currentPlayer?.is_drawing}
                  />
                  <Button
                    type="submit"
                    disabled={!gameState.currentWord || gameState.currentPlayer?.is_drawing}
                    className="w-full"
                  >
                    Submit Guess
                  </Button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
