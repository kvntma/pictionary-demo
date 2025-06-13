import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useGame } from '../contexts/GameContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export const RoomJoin: React.FC = () => {
  const { joinRoom, createRoom } = useGame();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleCreateRoom = async () => {
    setError('');
    setIsLoading(true);

    if (!playerName.trim()) {
      setError('Please enter your name');
      toast.error('Please enter your name');
      setIsLoading(false);
      return;
    }

    try {
      const newRoomCode = await createRoom();
      setRoomCode(newRoomCode);
      await joinRoom(newRoomCode, playerName);
      toast.success('Room created successfully!');
      navigate(`/game/${newRoomCode}`);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = 'Failed to create room. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setError('');
    setIsLoading(true);

    if (!playerName.trim()) {
      setError('Please enter your name');
      toast.error('Please enter your name');
      setIsLoading(false);
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      toast.error('Please enter a room code');
      setIsLoading(false);
      return;
    }

    try {
      await joinRoom(roomCode, playerName);
      setShowJoinModal(false);
      toast.success('Successfully joined the room!');
      navigate(`/game/${roomCode}`);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = 'Failed to join room. Please check the room code and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Pictionary Game</h1>

        <div className="space-y-4">
          <div>
            <Label htmlFor="playerName">Your Name</Label>
            <Input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</div>}

          <div className="flex flex-col space-y-2">
            <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isLoading} className="w-full">
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter Room Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      type="text"
                      id="roomCode"
                      value={roomCode}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setRoomCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter 4-digit room code"
                      disabled={isLoading}
                      maxLength={4}
                      pattern="[0-9]{4}"
                    />
                  </div>
                  <Button onClick={handleJoinRoom} disabled={isLoading} className="w-full">
                    {isLoading ? 'Loading...' : 'Join'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={handleCreateRoom} disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : 'Create New Room'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
