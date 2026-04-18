import fastapi
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Form
import pymysql
import os
from better_profanity import Profanity

Profanity.load_censor_words()

app = FastAPI()

rooms: dict[str, set[WebSocket]] = {}

def get_connection():
    return pymysql.connect(
        host="mysql-mint-cloud.alwaysdata.net",
        port=3306,
        user="mint-cloud",
        password=os.environ["MYSQL_PASSWORD"],
        database="mint-cloud_db",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )

@app.websocket("/websockets/chat")
async def chat_ws(ws: WebSocket):
    await ws.accept()
    joined_project_id = None

    try:
        while True:
            data = await ws.receive_json()

            # check required fields
            if not all(key in data for key in ("username", "project_id", "message")):
                await ws.send_json({"error": "Missing required fields."})
                continue

            username = str(data["username"]).strip()
            project_id = str(data["project_id"]).strip()
            message = str(data["message"]).strip()

            if not username or not project_id or not message:
                await ws.send_json({"error": "username, project_id, and message must not be empty.", "status_code": 400})
                continue

            if len(message) > 150:
                await ws.send_json({"error": "Message too long (max 150 chars).", "status_code": 400})
                continue
            if Profanity.contains_profanity(str(data["message"]).strip()):
                await ws.send_json({"error": "Message contains profanities.", "status_code": 400})
                continue

            rooms.setdefault(project_id, set()).add(ws)
            joined_project_id = project_id

            conn = get_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO chat_message (username, prj_id, text)
                        VALUES (%s, %s, %s)
                        """,
                        (username, project_id, message)
                    )
                    cur.execute(
                        """
                        DELETE FROM chat_message
                        WHERE prj_id = %s
                        AND id NOT IN (
                            SELECT id FROM (
                                SELECT id
                                FROM chat_message
                                WHERE prj_id = %s
                                ORDER BY created_at DESC, id DESC
                                LIMIT 100
                            ) AS keep_rows
                        )
                        """,
                        (project_id, project_id)
                    )
            finally:
                conn.close()

            payload = {
                "type": "message",
                "username": username,
                "project_id": project_id,
                "message": message,
            }

            dead = []
            for client in rooms.get(project_id, set()):
                try:
                    await client.send_json(payload)
                except Exception:
                    dead.append(client)

            for client in dead:
                rooms[project_id].discard(client)

    except WebSocketDisconnect:
        if joined_project_id and ws in rooms.get(joined_project_id, set()):
            rooms[joined_project_id].discard(ws)
            if not rooms[joined_project_id]:
                del rooms[joined_project_id]

@app.get("/get-chat")
async def get_chat(project: int = Query(...)):
    # get from DB (mysql)

    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM chat_message WHERE prj_id = %s
            ORDER BY created_at DESC
            """,
            (project,)
        )

        rows = cur.fetchall()

    conn.close()

    return {"data": rows}