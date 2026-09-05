"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { CALL_OFFER_TTL_MS, CALL_SIGNALING_EVENTS } from "@/lib/videocall/callConstants"
import { getStoredUserDisplayName } from "@/lib/videocall/callUser"
import { createAppSocket, joinUserRoom } from "@/lib/socket/client"

export function useCallSignaling({
  enabled = false,
  role,
  callId,
  userId,
  targetUserId,
  conversationId,
  mode = "video",
  myPeerId,
  callerPeerId,
  callerId,
  onRemoteAccepted,
  onRemoteRejected,
  onRemoteCancelled,
  onRemoteExpired,
}) {
  const socketRef = useRef(null)
  const offerSentRef = useRef(false)
  const acceptSentRef = useRef(false)
  const [socketReady, setSocketReady] = useState(false)

  // Use refs for dynamic callback properties to prevent socket tear-downs on every render
  const onRemoteAcceptedRef = useRef(onRemoteAccepted)
  const onRemoteRejectedRef = useRef(onRemoteRejected)
  const onRemoteCancelledRef = useRef(onRemoteCancelled)
  const onRemoteExpiredRef = useRef(onRemoteExpired)

  useEffect(() => {
    onRemoteAcceptedRef.current = onRemoteAccepted
    onRemoteRejectedRef.current = onRemoteRejected
    onRemoteCancelledRef.current = onRemoteCancelled
    onRemoteExpiredRef.current = onRemoteExpired
  })

  const emitCancel = useCallback(() => {
    if (!socketRef.current?.connected || !callId || !userId || !targetUserId) return

    socketRef.current.emit(CALL_SIGNALING_EVENTS.cancel, {
      callId,
      callerId: role === "caller" ? userId : targetUserId,
      calleeId: role === "caller" ? targetUserId : userId,
    })
  }, [callId, role, targetUserId, userId])

  const emitReject = useCallback(() => {
    if (!socketRef.current?.connected || !callId || !userId || !callerId) return

    socketRef.current.emit(CALL_SIGNALING_EVENTS.reject, {
      callId,
      callerId,
      calleeId: userId,
    })
  }, [callId, callerId, userId])

  const emitAccept = useCallback(
    (calleePeerId) => {
      if (!socketRef.current?.connected || !callId || !userId || !callerId || !calleePeerId) {
        return Promise.resolve({ success: false, error: "Not ready to accept call" })
      }

      if (acceptSentRef.current) {
        return Promise.resolve({ success: true })
      }

      acceptSentRef.current = true

      return new Promise((resolve) => {
        socketRef.current.emit(
          CALL_SIGNALING_EVENTS.accept,
          {
            callId,
            callerId,
            calleeId: userId,
            calleePeerId,
          },
          (response) => resolve(response || { success: false })
        )
      })
    },
    [callId, callerId, userId]
  )

  useEffect(() => {
    if (!enabled || !userId) return undefined

    const socket = createAppSocket()
    socketRef.current = socket

    socket.on("connect", () => {
      joinUserRoom(socket, userId)
      setSocketReady(true)
    })

    socket.on("reconnect", () => {
      joinUserRoom(socket, userId)
      setSocketReady(true)
    })

    socket.on(CALL_SIGNALING_EVENTS.accepted, (payload) => {
      if (!payload?.callId || String(payload.callId) !== String(callId)) return
      onRemoteAcceptedRef.current?.(payload)
    })

    socket.on(CALL_SIGNALING_EVENTS.rejected, (payload) => {
      if (!payload?.callId || String(payload.callId) !== String(callId)) return
      onRemoteRejectedRef.current?.(payload)
    })

    socket.on(CALL_SIGNALING_EVENTS.cancelled, (payload) => {
      if (!payload?.callId || String(payload.callId) !== String(callId)) return
      onRemoteCancelledRef.current?.(payload)
    })

    socket.on(CALL_SIGNALING_EVENTS.expired, (payload) => {
      if (!payload?.callId || String(payload.callId) !== String(callId)) return
      onRemoteExpiredRef.current?.(payload)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      offerSentRef.current = false
      acceptSentRef.current = false
      setSocketReady(false)
    }
  }, [enabled, userId, callId])

  useEffect(() => {
    if (!enabled || !socketReady || role !== "caller" || !myPeerId || !callId || !userId || !targetUserId) {
      return
    }
    if (!socketRef.current?.connected || offerSentRef.current) return

    offerSentRef.current = true

    socketRef.current.emit(
      CALL_SIGNALING_EVENTS.offer,
      {
        callId,
        callerId: userId,
        calleeId: targetUserId,
        callerPeerId: myPeerId,
        callerName: getStoredUserDisplayName(),
        conversationId,
        mode,
      },
      (response) => {
        if (!response?.success) {
          offerSentRef.current = false
          onRemoteExpiredRef.current?.({ callId, error: response?.error || "Could not reach callee" })
        }
      }
    )
  }, [
    enabled,
    socketReady,
    role,
    myPeerId,
    callId,
    userId,
    targetUserId,
    conversationId,
    mode,
  ])

  useEffect(() => {
    if (!enabled || !socketReady || role !== "callee" || !myPeerId || !callId || !userId || !callerId) {
      return
    }
    if (!socketRef.current?.connected || acceptSentRef.current) return

    emitAccept(myPeerId).then((response) => {
      if (!response?.success) {
        acceptSentRef.current = false
        onRemoteExpiredRef.current?.({ callId, error: response?.error || "Call offer expired" })
      }
    })
  }, [enabled, socketReady, role, myPeerId, callId, userId, callerId, emitAccept])

  useEffect(() => {
    if (!enabled || !callId) return undefined

    const timeoutId = window.setTimeout(() => {
      onRemoteExpiredRef.current?.({ callId, reason: "timeout" })
    }, CALL_OFFER_TTL_MS)

    return () => window.clearTimeout(timeoutId)
  }, [enabled, callId])

  return {
    emitCancel,
    emitReject,
    emitAccept,
  }
}
