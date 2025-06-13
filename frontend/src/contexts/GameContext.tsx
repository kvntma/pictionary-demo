import React, { createContext, useContext, useState, useEffect } from 'react';
import type { GameState, WebSocketMessage } from '../types/game';
import { websocketService } from '../services/websocket';

interface GameContextType {
  gameState: GameState;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  createRoom: () => Promise<string>;
  leaveRoom: () => Promise<void>;
  endGame: () => Promise<void>;
  sendDrawing: (x: number, y: number, color: string) => void;
  sendGuess: (guess: string) => void;
  incrementScore: () => Promise<void>;
  startGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

const initialState: GameState = {
  roomCode: null,
  currentPlayer: null,
  players: [],
  isConnected: false,
  isDrawing: false,
  currentWord: '',
  timeRemaining: 60,
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const fetchRoomState = async (roomCode: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/rooms/${roomCode}`);
      if (!response.ok) {
        throw new Error('Failed to get room state');
      }
      const roomData = await response.json();
      setGameState(prev => ({
        ...prev,
        players: roomData.players,
      }));
    } catch (error) {
      console.error('Error fetching room state:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'game_start':
          setGameState(prev => ({
            ...prev,
            currentWord: message.data.currentWord,
            players: message.data.room.players,
            currentPlayer:
              message.data.room.players.find(p => p.id === prev.currentPlayer?.id) || null,
            timeRemaining: message.data.room.time_remaining,
          }));
          break;
        case 'round_end':
          setGameState(prev => ({
            ...prev,
            currentWord: message.data.currentWord,
            players: message.data.room.players,
            currentPlayer:
              message.data.room.players.find(p => p.id === prev.currentPlayer?.id) || null,
            timeRemaining: message.data.room.time_remaining,
          }));
          break;
        case 'time_update':
          setGameState(prev => ({
            ...prev,
            timeRemaining: message.data.timeRemaining,
          }));
          break;
        case 'player_joined':
          setGameState(prev => ({
            ...prev,
            players: [...prev.players, message.data.player],
          }));
          break;
        case 'player_left':
          setGameState(prev => ({
            ...prev,
            players: prev.players.filter(p => p.id !== message.data.playerId),
          }));
          break;
        case 'guess':
          if (message.data.correct) {
            setGameState(prev => ({
              ...prev,
              currentWord: message.data.word || '',
              players: prev.players.map(p =>
                p.id === message.data.playerId ? { ...p, score: p.score + 1 } : p
              ),
            }));
          }
          break;
      }
    };

    const cleanup = websocketService.addMessageHandler(handleMessage);
    return cleanup;
  }, [gameState.roomCode]);

  const createRoom = async (): Promise<string> => {
    try {
      const response = await fetch('http://localhost:8000/api/rooms', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const { code } = await response.json();
      return code;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  const joinRoom = async (roomCode: string, playerName: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/rooms/${roomCode}/join?player_name=${encodeURIComponent(
          playerName
        )}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to join room');
      }

      const { player_id } = await response.json();
      websocketService.connect(roomCode);

      // Get initial room state
      const roomResponse = await fetch(`http://localhost:8000/api/rooms/${roomCode}`);
      if (!roomResponse.ok) {
        throw new Error('Failed to get room state');
      }
      const roomData = await roomResponse.json();

      setGameState(prev => ({
        ...prev,
        isConnected: true,
        currentPlayer: {
          id: player_id,
          name: playerName,
          is_drawing: false,
          score: 0,
        },
        players: roomData.players,
        roomCode,
      }));
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  };

  const leaveRoom = async () => {
    if (!gameState.roomCode || !gameState.currentPlayer) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/rooms/${gameState.roomCode}/leave?player_id=${gameState.currentPlayer.id}`,
        { method: 'POST' }
      );

      // If room is already gone (404) or any other error, just clean up locally
      if (!response.ok) {
        console.log('Room already closed or error occurred, cleaning up locally');
      }

      websocketService.disconnect();
      setGameState(initialState);
    } catch (error) {
      console.error('Error leaving room:', error);
      // Even if there's an error, clean up locally
      websocketService.disconnect();
      setGameState(initialState);
    }
  };

  const endGame = async () => {
    if (!gameState.roomCode) return;

    try {
      const response = await fetch(`http://localhost:8000/api/rooms/${gameState.roomCode}/end`, {
        method: 'POST',
      });

      // If room is already gone (404) or any other error, just clean up locally
      if (!response.ok) {
        console.log('Room already closed or error occurred, cleaning up locally');
      }

      websocketService.disconnect();
      setGameState(initialState);
    } catch (error) {
      console.error('Error ending game:', error);
      // Even if there's an error, clean up locally
      websocketService.disconnect();
      setGameState(initialState);
    }
  };

  const sendDrawing = (x: number, y: number, color: string) => {
    websocketService.sendMessage({
      type: 'draw',
      data: { x, y, color },
    });
  };

  const sendGuess = (guess: string) => {
    if (!gameState.currentPlayer) return;

    websocketService.sendMessage({
      type: 'guess',
      data: {
        playerId: gameState.currentPlayer.id,
        guess,
        correct: false,
      },
    });
  };

  // Debug function to increment score
  const incrementScore = async () => {
    if (!gameState.roomCode || !gameState.currentPlayer) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/rooms/${gameState.roomCode}/debug/score?player_id=${gameState.currentPlayer.id}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to increment score');
      }

      // Refresh room state to get updated scores
      if (gameState.roomCode) {
        fetchRoomState(gameState.roomCode);
      }
    } catch (error) {
      console.error('Error incrementing score:', error);
    }
  };

  const startGame = async () => {
    if (!gameState.roomCode) return;

    try {
      const response = await fetch(`http://localhost:8000/api/rooms/${gameState.roomCode}/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        joinRoom,
        createRoom,
        leaveRoom,
        endGame,
        sendDrawing,
        sendGuess,
        incrementScore,
        startGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
