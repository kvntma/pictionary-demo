from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import random
import string
import asyncio
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
rooms: Dict[str, "Room"] = {}
active_connections: Dict[str, List[WebSocket]] = {}
room_timers: Dict[str, asyncio.Task] = {}

# Game constants
ROUND_TIME = 60  # seconds

# Pydantic models
class Player(BaseModel):
    id: str
    name: str
    is_drawing: bool
    score: int

class Room(BaseModel):
    code: str
    players: List[Player]
    current_round: int
    current_word: str
    scores: Dict[str, int]
    time_remaining: int = ROUND_TIME

# Word list (we'll expand this later)
WORDS = ["cat", "dog", "house", "tree", "sun", "moon", "star", "book", "chair", "table"]

def generate_room_code() -> str:
    """Generate a 4-digit room code"""
    return ''.join(random.choices(string.digits, k=4))

@app.post("/api/rooms")
async def create_room():
    """Create a new game room with a 4-digit code"""
    code = generate_room_code()
    while code in rooms:  # Ensure unique code
        code = generate_room_code()
    
    rooms[code] = Room(
        code=code,
        players=[],
        current_round=0,
        current_word="",
        scores={}
    )
    return {"code": code}

@app.get("/api/rooms/{code}")
async def get_room(code: str):
    """Get room details by code"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    return rooms[code]

@app.post("/api/rooms/{code}/join")
async def join_room(code: str, player_name: str):
    """Join an existing room"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[code]
    if len(room.players) >= 4:
        raise HTTPException(status_code=400, detail="Room is full")
    
    player_id = str(len(room.players) + 1)
    player = Player(
        id=player_id,
        name=player_name,
        is_drawing=False,
        score=0
    )
    
    room.players.append(player)
    room.scores[player_id] = 0

    # Broadcast player joined event
    if code in active_connections:
        for connection in active_connections[code]:
            await connection.send_json({
                "type": "player_joined",
                "data": {"player": player.dict()}
            })

    return {"player_id": player_id}

@app.post("/api/rooms/{code}/leave")
async def leave_room(code: str, player_id: str):
    """Leave a game room"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[code]
    # Remove player from room
    room.players = [p for p in room.players if p.id != player_id]
    if player_id in room.scores:
        del room.scores[player_id]
    
    # Broadcast player left event
    if code in active_connections:
        for connection in active_connections[code]:
            await connection.send_json({
                "type": "player_left",
                "data": {"playerId": player_id}
            })
    
    # If no players left, delete the room
    if not room.players:
        del rooms[code]
        return {"message": "Room deleted"}
    
    return {"message": "Player left room"}

@app.post("/api/rooms/{code}/end")
async def end_game(code: str):
    """End the game and delete the room"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Cancel timer if it exists
    if code in room_timers:
        room_timers[code].cancel()
        del room_timers[code]
    
    # Delete room data
    del rooms[code]
    return {"message": "Game ended"}

@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    """Handle WebSocket connections for real-time game updates"""
    if room_code not in rooms:
        await websocket.close(code=4004)
        return
    
    await websocket.accept()
    
    # Add connection to active connections
    if room_code not in active_connections:
        active_connections[room_code] = []
    active_connections[room_code].append(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            # Handle different message types
            if data["type"] == "draw":
                # Broadcast drawing data to other players
                for connection in active_connections[room_code]:
                    if connection != websocket:  # Don't send back to sender
                        await connection.send_json(data)
            elif data["type"] == "guess":
                # Handle word guesses
                room = rooms[room_code]
                guess = data["data"]["guess"].lower()
                player_id = data["data"]["playerId"]
                
                # Check if guess is correct
                if guess == room.current_word.lower():
                    # Update player score
                    for player in room.players:
                        if player.id == player_id:
                            player.score += 1
                            break
                    
                    # Broadcast correct guess
                    for connection in active_connections[room_code]:
                        await connection.send_json({
                            "type": "guess",
                            "data": {
                                "playerId": player_id,
                                "correct": True,
                                "word": room.current_word
                            }
                        })
                    
                    # Start new round
                    await start_new_round(room_code)
                else:
                    # Broadcast incorrect guess
                    for connection in active_connections[room_code]:
                        await connection.send_json({
                            "type": "guess",
                            "data": {
                                "playerId": player_id,
                                "correct": False
                            }
                        })
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Remove connection when done
        active_connections[room_code].remove(websocket)
        if not active_connections[room_code]:
            del active_connections[room_code]
        await websocket.close()

async def start_new_round(room_code: str):
    """Start a new round by selecting a new drawer and word"""
    if room_code not in rooms:
        return
    
    room = rooms[room_code]
    
    # Select a random word
    room.current_word = random.choice(WORDS)
    
    # Select next drawer (round-robin)
    current_drawer_index = next((i for i, p in enumerate(room.players) if p.is_drawing), -1)
    next_drawer_index = (current_drawer_index + 1) % len(room.players)
    
    # Reset all players' drawing status
    for player in room.players:
        player.is_drawing = False
    
    # Set new drawer
    room.players[next_drawer_index].is_drawing = True
    room.current_round += 1
    room.time_remaining = ROUND_TIME
    
    # Print debug info
    print(f"New round started:")
    print(f"Current word: {room.current_word}")
    print(f"Current drawer: {room.players[next_drawer_index].name}")
    print(f"All players: {[(p.name, p.is_drawing) for p in room.players]}")
    
    # Broadcast round start event
    if room_code in active_connections:
        for connection in active_connections[room_code]:
            await connection.send_json({
                "type": "round_end",
                "data": {
                    "room": room.dict(),
                    "currentWord": room.current_word if room.players[next_drawer_index].is_drawing else ""
                }
            })
    
    # Start new timer
    if room_code in room_timers:
        room_timers[room_code].cancel()
    room_timers[room_code] = asyncio.create_task(start_round_timer(room_code))

async def start_round_timer(room_code: str):
    """Start a timer for the current round"""
    room = rooms[room_code]
    
    while room.time_remaining > 0:
        await asyncio.sleep(1)
        room.time_remaining -= 1
        
        # Broadcast time update
        if room_code in active_connections:
            for connection in active_connections[room_code]:
                await connection.send_json({
                    "type": "time_update",
                    "data": {
                        "timeRemaining": room.time_remaining
                    }
                })
    
    # Time's up - end the round
    if room_code in rooms:  # Check if room still exists
        await start_new_round(room_code)

@app.post("/api/rooms/{code}/start")
async def start_game(code: str):
    """Start the game in a room"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[code]
    if len(room.players) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 players to start")
    
    # Start first round
    await start_new_round(code)
    
    # Broadcast game start event
    if code in active_connections:
        for connection in active_connections[code]:
            await connection.send_json({
                "type": "game_start",
                "data": {
                    "room": room.dict(),
                    "currentWord": room.current_word if room.players[0].is_drawing else ""
                }
            })
    
    return {"message": "Game started"}

@app.post("/api/rooms/{code}/round/next")
async def next_round(code: str):
    """Move to the next round"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    await start_new_round(code)
    return {"message": "Next round started"}

@app.post("/api/rooms/{code}/debug/score")
async def debug_increment_score(code: str, player_id: str):
    """Debug endpoint to increment a player's score"""
    if code not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = rooms[code]
    for player in room.players:
        if player.id == player_id:
            player.score += 1
            break
    
    return {"message": "Score incremented"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
