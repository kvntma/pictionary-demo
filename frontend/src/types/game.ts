export interface Player {
  id: string;
  name: string;
  is_drawing: boolean;
  score: number;
}

export interface Room {
  code: string;
  players: Player[];
  current_round: number;
  current_word: string;
  scores: Record<string, number>;
  time_remaining: number;
}

export interface GameState {
  roomCode: string | null;
  currentPlayer: Player | null;
  players: Player[];
  isConnected: boolean;
  isDrawing: boolean;
  currentWord: string;
  timeRemaining: number;
}

export interface DrawMessage {
  x: number;
  y: number;
  color: string;
}

export interface PlayerJoinedMessage {
  player: Player;
}

export interface PlayerLeftMessage {
  playerId: string;
}

export interface GameStartMessage {
  room: Room;
  currentWord: string;
}

export interface RoundEndMessage {
  room: Room;
  currentWord: string;
}

export interface GuessMessage {
  playerId: string;
  guess: string;
  correct: boolean;
  word?: string;
}

export interface TimeUpdateMessage {
  timeRemaining: number;
}

export type WebSocketMessage =
  | {
      type: 'draw';
      data: DrawMessage;
    }
  | {
      type: 'guess';
      data: GuessMessage;
    }
  | {
      type: 'round_end';
      data: RoundEndMessage;
    }
  | {
      type: 'game_start';
      data: GameStartMessage;
    }
  | {
      type: 'player_joined';
      data: PlayerJoinedMessage;
    }
  | {
      type: 'player_left';
      data: PlayerLeftMessage;
    }
  | {
      type: 'time_update';
      data: TimeUpdateMessage;
    };
