"use client"

import { useCallback, useEffect, useState } from "react"
import { io } from "socket.io-client"
import toast from "react-hot-toast"

import IncomingCallDialog from "@/components/IncomingCallDialog"
import { CALL_SIGNALING_EVENTS } from "@/lib/videocall/callConstants"
import { getStoredUser } from "@/lib/videocall/callUser"

export default function IncomingCallManager() {
  const [currentUser, setCurrentUser] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    setCurrentUser(getStoredUser())
  }, [])

  useEffect(() => {
    if (!currentUser?.id) return undefined

    const socketInstance = io(undefined, { path: "/api/socketio" })
    setSocket(socketInstance)

    socketInstance.on("connect", () => {
      socketInstance.emit("join_user", { userId: currentUser.id })
    })

    socketInstance.on(CALL_SIGNALING_EVENTS.incoming, (payload) => {
      if (!payload?.callId) return
      setIncomingCall(payload)
    })

    socketInstance.on(CALL_SIGNALING_EVENTS.expired, (payload) => {
      setIncomingCall((current) => {
        if (!current || String(current.callId) !== String(payload?.callId)) return current
        toast.error("Call timed out")
        return null
      })
    })

    socketInstance.on(CALL_SIGNALING_EVENTS.cancelled, (payload) => {
      setIncomingCall((current) => {
        if (!current || String(current.callId) !== String(payload?.callId)) return current
        toast.error("Caller cancelled the call")
        return null
      })
    })

    return () => {
      socketInstance.disconnect()
      setSocket(null)
    }
  }, [currentUser?.id])

  const handleDeclineIncomingCall = useCallback((options = {}) => {
    if (incomingCall && socket?.connected && currentUser?.id && !options.expired) {
      socket.emit(CALL_SIGNALING_EVENTS.reject, {
        callId: incomingCall.callId,
        callerId: incomingCall.callerId,
        calleeId: currentUser.id,
      })
    }
    setIncomingCall(null)
  }, [incomingCall, socket, currentUser])

  const handleAcceptIncomingCall = useCallback((call) => {
    if (!call?.callId || !call?.callerPeerId) return

    const params = new URLSearchParams({
      role: "callee",
      callId: String(call.callId),
      callerId: String(call.callerId),
      callerPeerId: String(call.callerPeerId),
      conversationId: String(call.conversationId || ""),
      targetName: call.callerName || "Friend",
      mode: call.mode === "audio" ? "audio" : "video",
      auto: "1",
    })

    setIncomingCall(null)
    window.open(`/videocall?${params.toString()}`, "_blank", "noopener,noreferrer")
  }, [])

  return (
    <IncomingCallDialog
      incomingCall={incomingCall}
      onAccept={handleAcceptIncomingCall}
      onDecline={handleDeclineIncomingCall}
    />
  )
}
