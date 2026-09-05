"use client"



import { useCallback, useEffect, useRef, useState } from "react"

import toast from "react-hot-toast"



import IncomingCallDialog from "@/components/IncomingCallDialog"

import { CALL_SIGNALING_EVENTS } from "@/lib/videocall/callConstants"

import { getStoredUserId } from "@/lib/videocall/callUser"

import { createAppSocket, joinUserRoom } from "@/lib/socket/client"

import { useIncomingCallStore } from "@/stores/incomingCallStore"



export default function IncomingCallManager() {

  const incomingCall = useIncomingCallStore((s) => s.incomingCall)

  const setIncomingCall = useIncomingCallStore((s) => s.setIncomingCall)

  const clearIncomingCall = useIncomingCallStore((s) => s.clearIncomingCall)



  const [userId, setUserId] = useState(null)

  const socketRef = useRef(null)



  useEffect(() => {

    const syncUser = () => setUserId(getStoredUserId())

    syncUser()



    window.addEventListener("storage", syncUser)

    window.addEventListener("asyv-auth-updated", syncUser)

    return () => {

      window.removeEventListener("storage", syncUser)

      window.removeEventListener("asyv-auth-updated", syncUser)

    }

  }, [])



  useEffect(() => {

    if (!userId) return undefined



    const socket = createAppSocket()

    socketRef.current = socket



    const onIncoming = (payload) => {

      if (!payload?.callId) return

      setIncomingCall(payload)

    }



    const onExpired = (payload) => {

      const current = useIncomingCallStore.getState().incomingCall

      if (!current || String(current.callId) !== String(payload?.callId)) return

      toast.error("Call timed out")

      clearIncomingCall()

    }



    const onCancelled = (payload) => {

      const current = useIncomingCallStore.getState().incomingCall

      if (!current || String(current.callId) !== String(payload?.callId)) return

      toast.error("Caller cancelled the call")

      clearIncomingCall()

    }



    socket.on("connect", () => joinUserRoom(socket, userId))

    socket.on("reconnect", () => joinUserRoom(socket, userId))

    socket.on(CALL_SIGNALING_EVENTS.incoming, onIncoming)

    socket.on(CALL_SIGNALING_EVENTS.expired, onExpired)

    socket.on(CALL_SIGNALING_EVENTS.cancelled, onCancelled)



    return () => {

      socket.off(CALL_SIGNALING_EVENTS.incoming, onIncoming)

      socket.off(CALL_SIGNALING_EVENTS.expired, onExpired)

      socket.off(CALL_SIGNALING_EVENTS.cancelled, onCancelled)

      socket.disconnect()

      socketRef.current = null

    }

  }, [userId, setIncomingCall, clearIncomingCall])



  const handleDeclineIncomingCall = useCallback(

    (options = {}) => {

      const call = useIncomingCallStore.getState().incomingCall

      const socket = socketRef.current

      if (call && socket?.connected && userId && !options.expired) {

        socket.emit(CALL_SIGNALING_EVENTS.reject, {

          callId: call.callId,

          callerId: call.callerId,

          calleeId: userId,

        })

      }

      clearIncomingCall()

    },

    [userId, clearIncomingCall]

  )



  const handleAcceptIncomingCall = useCallback(

    (call) => {

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



      clearIncomingCall()

      window.open(`/videocall?${params.toString()}`, "_blank", "noopener,noreferrer")

    },

    [clearIncomingCall]

  )



  return (

    <IncomingCallDialog

      incomingCall={incomingCall}

      onAccept={handleAcceptIncomingCall}

      onDecline={handleDeclineIncomingCall}

    />

  )

}


