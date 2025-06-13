# Pictionary Game

A real-time multiplayer drawing and guessing game built with React, TypeScript, and WebSocket.

## Features

- Real-time multiplayer drawing and guessing
- Room-based gameplay
- Score tracking
- Multiple colors for drawing
- Responsive design
- Beautiful UI with Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Python 3.8 or higher (for backend)

## Project Structure

```
pictionary/
├── frontend/          # React frontend
└── backend/           # Python backend
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):

   ```bash
   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # On Windows
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

The backend server will be running at `http://localhost:8000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be running at `http://localhost:5173`

## How to Play

1. Open `http://localhost:5173` in your browser
2. Create a new room or join an existing one
3. Wait for at least 2 players to join (OPEN TWO TABS - JOIN WITH DIFFERENT ACCOUNTS!) THIS IS LOCALLY HOSTED!
4. Start the game
5. Take turns drawing and guessing
6. First player to reach 5 points wins!

## Development

### Frontend Development

The frontend is built with:

- React
- TypeScript
- Tailwind CSS
- WebSocket for real-time communication

Key features:

- Real-time drawing synchronization
- Color picker
- Player list with scores
- Game state management
- Responsive design

### Backend Development

The backend is built with:

- FastAPI
- WebSocket support
- Room management
- Game state management

## API Endpoints

### Backend API

- `POST /api/rooms` - Create a new room
- `POST /api/rooms/{room_code}/join` - Join a room
- `POST /api/rooms/{room_code}/start` - Start the game
- `POST /api/rooms/{room_code}/leave` - Leave the room
- `POST /api/rooms/{room_code}/end` - End the game
- `GET /api/rooms/{room_code}` - Get room state


There are no .env files - hardcoded for local development
