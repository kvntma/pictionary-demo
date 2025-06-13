# Pictionary Game Backend

FastAPI backend for the Pictionary game demo.

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Running the Server

Start the development server:

```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### REST Endpoints

- `POST /api/rooms` - Create a new game room
- `GET /api/rooms/{code}` - Get room details
- `POST /api/rooms/{code}/join` - Join a room

### WebSocket

- `ws://localhost:8000/ws/{room_code}` - WebSocket connection for real-time game updates
