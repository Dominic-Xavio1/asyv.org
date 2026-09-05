import { io } from "socket.io-client"

const SOCKET_PATH = "/api/socketio"


export function createAppSocket() {
  try{
  const url =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      : undefined

  return io(url, {
    path: SOCKET_PATH,
    // prefer polling first for environments where websocket upgrades fail
    transports: ["polling", "websocket"],
    // increase default timeout to give the server more time to respond
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 10,
  })
  }
  catch (error) {
    console.error("Failed to create socket connection:", error)
    return null
  }

}

export function joinUserRoom(socket, userId) {
  if (!socket?.connected || userId == null || userId === "") return
  socket.emit("join_user", { userId: String(userId) })
} 

