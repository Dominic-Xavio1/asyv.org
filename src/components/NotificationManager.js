"use client"

import { useEffect, useRef } from "react"
import { io } from "socket.io-client"
import toast from "react-hot-toast"
import { usePathname } from "next/navigation"

export default function NotificationManager() {
  const socketRef = useRef(null)
  const pathname = usePathname()

  useEffect(() => {
    try {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        path: "/api/socketio",
        transports: ["websocket", "polling"],
      })

      socketInstance.on("connect", () => {
        // connected
      })

      socketInstance.on("notification", (payload) => {
        // Avoid showing notification UI when the user is already viewing notifications page
        if (pathname && pathname.startsWith("/notification")) return

        const title = payload?.title || "Notification"
        const body = payload?.body || (payload?.message || "You have a new notification")

        toast((t) => (
          <div>
            <strong>{title}</strong>
            <div>{body}</div>
          </div>
        ), {
          id: `notif-${payload?.id || Date.now()}`,
          duration: 6000,
          icon: '🔔',
        })
      })

      socketRef.current = socketInstance

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect()
          socketRef.current = null
        }
      }
    } catch (error) {
      console.error("Error initializing notification socket:", error)
    }
  }, [pathname])

  return null
}
