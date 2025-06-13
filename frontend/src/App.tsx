import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { GameProvider } from './contexts/GameContext';
import { Game } from './components/Game';
import { RoomJoin } from './components/RoomJoin';
import { useGame } from './contexts/GameContext';

const GameContent: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState.isConnected) {
    return <Navigate to="/" replace />;
  }

  return <Game />;
};

function App() {
  return (
    <GameProvider>
      <Router>
        <Toaster richColors position="top-center" />
        <Routes>
          <Route path="/" element={<RoomJoin />} />
          <Route path="/game/:roomId" element={<GameContent />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;
