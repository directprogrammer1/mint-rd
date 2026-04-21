import fastapi
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Form
from fastapi.middleware import cors
import pymysql
import os
from better_profanity import profanity
import traceback


profanity.load_censor_words()

app = FastAPI()

app.add_middleware(
    cors.CORSMiddleware,
    allow_origins=[
        "*"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.websocket("/websockets/chat/{project_id}")
async def chat_ws(ws: WebSocket, project_id: str):
    await ws.accept()

    rooms.setdefault(project_id, set()).add(ws)

    def leave_room():
        room = rooms.get(project_id)
        if not room:
            return
        room.discard(ws)
        if not room:
            del rooms[project_id]

    try:
        while True:
            try:
                data = await ws.receive_json()
            except WebSocketDisconnect:
                print(f"Client disconnected from room {project_id}")
                break
            except Exception as e:
                print("receive_json failed:", repr(e))
                traceback.print_exc()
                try:
                    await ws.close(code=1003)
                except Exception:
                    pass
                break

            try:
                if not isinstance(data, dict):
                    await ws.send_json({"error": "Invalid payload."})
                    continue

                if not all(k in data for k in ("username", "message")):
                    await ws.send_json({"error": "Missing required fields."})
                    continue

                username = str(data["username"]).strip()
                message = str(data["message"]).strip()

                if not username or not message:
                    await ws.send_json({
                        "error": "username and message must not be empty.",
                        "status_code": 400
                    })
                    continue

                if len(message) > 150:
                    await ws.send_json({
                        "error": "Message too long (max 150 chars).",
                        "status_code": 400
                    })
                    continue

                if profanity.contains_profanity(message):
                    await ws.send_json({
                        "error": "Message contains profanities.",
                        "status_code": 400
                    })
                    continue

                try:
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
                    finally:
                        conn.close()
                except pymysql.MySQLError as e:
                    print("INSERT failed:", repr(e))
                    traceback.print_exc()
                    await ws.send_json({
                        "error": "Database error while saving message.",
                        "details": str(e)
                    })
                    continue

                try:
                    conn = get_connection()
                    try:
                        with conn.cursor() as cur:
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
                                        LIMIT 150
                                    ) AS keep_rows
                                  )
                                """,
                                (project_id, project_id)
                            )
                    finally:
                        conn.close()
                except pymysql.MySQLError as e:
                    print("Cleanup DELETE failed:", repr(e))
                    traceback.print_exc()

                payload = {
                    "type": "message",
                    "username": username,
                    "project_id": project_id,
                    "message": message,
                }

                clients = list(rooms.get(project_id, set()))
                dead = []

                for client in clients:
                    try:
                        await client.send_json(payload)
                    except WebSocketDisconnect:
                        dead.append(client)
                    except Exception as e:
                        print("Broadcast failed:", repr(e))
                        traceback.print_exc()
                        dead.append(client)

                for client in dead:
                    rooms.get(project_id, set()).discard(client)

            except Exception as e:
                print("Unhandled websocket error:", repr(e))
                traceback.print_exc()
                try:
                    await ws.send_json({
                        "error": "Internal server error.",
                        "details": str(e)
                    })
                    await ws.close(code=1011)
                except Exception:
                    pass
                break

    finally:
        leave_room()

@app.get("/get-chat")
async def get_chat(project: int = Query(...)):
    # get from DB (mysql)

    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM chat_message WHERE prj_id = %s
            ORDER BY created_at DESC
            LIMIT 150
            """,
            (project,)
        )

        rows = cur.fetchall()

    conn.close()

    return {"data": rows}