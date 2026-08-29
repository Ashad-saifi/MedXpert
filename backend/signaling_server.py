import asyncio
import json
import logging
import websockets

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SignalingServer")

# Store connected clients: room_id -> { ws: { "role": role, "user_id": user_id } }
rooms = {}

async def register(websocket, room, role, user_id):
    if room not in rooms:
        rooms[room] = {}
    rooms[room][websocket] = {"role": role, "user_id": user_id}
    logger.info(f"User {user_id} joined room {room} as {role}")

    # Notify other participants in the room
    join_notification = json.dumps({
        "type": "peer-joined",
        "role": role,
        "userId": user_id
    })
    for client in list(rooms[room].keys()):
        if client != websocket:
            try:
                await client.send(join_notification)
            except Exception as e:
                logger.error(f"Failed to notify client on join: {e}")

async def unregister(websocket):
    for room, clients in list(rooms.items()):
        if websocket in clients:
            client_info = clients.pop(websocket)
            logger.info(f"User {client_info['user_id']} ({client_info['role']}) left room {room}")
            
            # Notify other participants in the room
            leave_notification = json.dumps({
                "type": "peer-left",
                "role": client_info["role"],
                "userId": client_info["user_id"]
            })
            for client in list(clients.keys()):
                try:
                    await client.send(leave_notification)
                except Exception as e:
                    logger.error(f"Failed to notify client on leave: {e}")
                
            # Cleanup empty room
            if not rooms[room]:
                rooms.pop(room)
            break

async def handler(websocket):
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")
                room = data.get("room", "default")
                
                if msg_type == "join":
                    role = data.get("role", "unknown")
                    user_id = data.get("userId", "unknown")
                    await register(websocket, room, role, user_id)
                else:
                    # Forward message to other clients in the same room
                    if room in rooms:
                        for client in list(rooms[room].keys()):
                            if client != websocket:
                                try:
                                    await client.send(message)
                                except Exception as e:
                                    logger.error(f"Failed to forward message: {e}")
            except json.JSONDecodeError:
                logger.error("Failed to decode JSON message")
            except Exception as e:
                logger.error(f"Error handling message: {e}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        await unregister(websocket)

async def main():
    port = 5001
    async with websockets.serve(handler, "0.0.0.0", port):
        logger.info(f"Python Real-time Signaling Server running on ws://0.0.0.0:{port}")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
