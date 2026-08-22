import asyncio
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["Live Telemetry"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()


@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    """
    Establishes a real-time WebSocket telemetry stream.
    Simulates automated live DWLR sensor pings every 8-10 seconds for real-time demonstration.
    """
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(8)  # Ping interval for smooth live demo
            
            simulated_ping = {
                "type": "LIVE_PING",
                "station_id": random.choice(["DWLR-UP-001", "DWLR-PB-042", "DWLR-RJ-105", "DWLR-MH-088"]),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "water_level_m_bgl": round(random.uniform(4.0, 23.5), 2),
                "is_live": True
            }
            await manager.broadcast(simulated_ping)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket stream encountered exception: {e}")
        manager.disconnect(websocket)
