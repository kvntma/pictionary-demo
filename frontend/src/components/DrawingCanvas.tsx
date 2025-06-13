import React, { useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { websocketService } from '../services/websocket';
import type { WebSocketMessage } from '../types/game';

interface DrawingCanvasProps {
  currentColor: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ currentColor }) => {
  const { gameState, sendDrawing } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1000;
    canvas.height = 700;

    // Set initial canvas style
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []); // Only run once on mount

  // Update stroke style when color changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
  }, [currentColor]);

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Allow drawing if game hasn't started (no current word) or if it's the player's turn
    if (gameState.currentWord && !gameState.currentPlayer?.is_drawing) return;

    const pos = getMousePosition(e);
    if (!pos) return;

    lastPointRef.current = pos;

    // Draw initial point
    drawLine(pos.x, pos.y, pos.x, pos.y, currentColor);
    sendDrawing(pos.x, pos.y, currentColor);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Allow drawing if game hasn't started (no current word) or if it's the player's turn
    if (gameState.currentWord && !gameState.currentPlayer?.is_drawing) return;

    const pos = getMousePosition(e);
    if (!pos || !lastPointRef.current) return;

    // Draw line from last point to current point
    drawLine(lastPointRef.current.x, lastPointRef.current.y, pos.x, pos.y, currentColor);
    sendDrawing(pos.x, pos.y, currentColor);

    lastPointRef.current = pos;
  };

  const stopDrawing = () => {
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Handle drawing messages
  useEffect(() => {
    const handleDrawMessage = (message: WebSocketMessage) => {
      if (message.type !== 'draw') return;

      const { x, y, color } = message.data;

      if (lastPointRef.current) {
        drawLine(lastPointRef.current.x, lastPointRef.current.y, x, y, color);
      }

      lastPointRef.current = { x, y };
    };

    const cleanup = websocketService.addMessageHandler(handleDrawMessage);
    return cleanup;
  }, []);

  // Handle game state updates that should clear the canvas
  useEffect(() => {
    const handleMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'game_start':
          clearCanvas();
          break;
        case 'round_end':
          clearCanvas();
          break;
        case 'guess':
          if (message.data.correct) {
            clearCanvas();
          }
          break;
      }
    };

    const cleanup = websocketService.addMessageHandler(handleMessage);
    return cleanup;
  }, []);

  return (
    <div className="lg:col-span-3">
      <canvas
        ref={canvasRef}
        width={1000}
        height={700}
        className="border border-gray-300 rounded bg-white w-full"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseLeave={stopDrawing}
      />
      {(gameState.currentPlayer?.is_drawing || !gameState.currentWord) && (
        <button
          onClick={clearCanvas}
          className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear Canvas
        </button>
      )}
    </div>
  );
};
