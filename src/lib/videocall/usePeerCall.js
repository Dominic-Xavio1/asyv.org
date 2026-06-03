"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { createPeerClient } from "@/lib/videocall/peerClient"

const READY_STATUS = {
  idle: "Idle",
  initializing: "Initializing...",
  ready: "Ready",
  calling: "Calling...",
  incoming: "Incoming call",
  inCall: "In call",
  ended: "Call ended",
  failed: "Connection issue",
}

export function usePeerCall({ mediaMode = "video", autoAcceptPeerId = "" } = {}) {
  const peerRef = useRef(null)
  const activeCallRef = useRef(null)
  const incomingCallRef = useRef(null)
  const localStreamRef = useRef(null)

  const [myPeerId, setMyPeerId] = useState("")
  const [remotePeerId, setRemotePeerId] = useState("")
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [status, setStatus] = useState("initializing")
  const [error, setError] = useState("")
  const [incomingFrom, setIncomingFrom] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)

  const statusLabel = useMemo(() => READY_STATUS[status] || READY_STATUS.idle, [status])

  const stopStreamTracks = (stream) => {
    if (!stream) return
    stream.getTracks().forEach((track) => track.stop())
  }

  const clearCallState = useCallback(() => {
    if (activeCallRef.current) {
      activeCallRef.current.close()
      activeCallRef.current = null
    }
    incomingCallRef.current = null
    setIncomingFrom("")
    setRemoteStream(null)
    setStatus((current) => (current === "failed" ? current : "ended"))
  }, [])

  const getLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mediaMode !== "audio",
        audio: true,
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      setIsMuted(false)
      setIsCameraOff(false)
      return stream
    } catch (mediaError) {
      setError("Unable to access camera or microphone. Check permissions and retry.")
      setStatus("failed")
      throw mediaError
    }
  }, [mediaMode])

  const bindCallEvents = useCallback((call) => {
    activeCallRef.current = call

    call.on("stream", (stream) => {
      setRemoteStream(stream)
      setStatus("inCall")
    })

    call.on("close", () => {
      clearCallState()
    })

    call.on("error", () => {
      setError("Call dropped unexpectedly. Please reconnect.")
      setStatus("failed")
      clearCallState()
    })
  }, [clearCallState])

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCallRef.current) return
    const call = incomingCallRef.current
    incomingCallRef.current = null
    setIncomingFrom("")
    setError("")

    const stream = await getLocalMedia()
    call.answer(stream)
    bindCallEvents(call)
  }, [bindCallEvents, getLocalMedia])

  const rejectIncomingCall = useCallback(() => {
    if (incomingCallRef.current) {
      incomingCallRef.current.close()
      incomingCallRef.current = null
    }
    setIncomingFrom("")
    setStatus("ready")
  }, [])

  const callPeer = useCallback(async (targetPeerId) => {
    const normalizedId = targetPeerId.trim()
    if (!normalizedId || !peerRef.current) return
    if (normalizedId === myPeerId) {
      setError("You cannot call your own ID.")
      return
    }

    setError("")
    setStatus("calling")
    setRemoteStream(null)
    const stream = await getLocalMedia()
    const call = peerRef.current.call(normalizedId, stream)
    bindCallEvents(call)
  }, [bindCallEvents, getLocalMedia, myPeerId])

  const endCall = useCallback(() => {
    clearCallState()
    stopStreamTracks(localStreamRef.current)
    localStreamRef.current = null
    setLocalStream(null)
    setIsMuted(false)
    setIsCameraOff(false)
    setStatus("ready")
  }, [clearCallState])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const nextMuted = !isMuted
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted
    })
    setIsMuted(nextMuted)
  }, [isMuted])

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const nextCameraOff = !isCameraOff
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff
    })
    setIsCameraOff(nextCameraOff)
  }, [isCameraOff])

  useEffect(() => {
    if (!autoAcceptPeerId || status !== "incoming" || incomingFrom !== autoAcceptPeerId) return

    acceptIncomingCall().catch(() => {
      setError("Could not join the call. Check camera and microphone permissions.")
      setStatus("failed")
    })
  }, [autoAcceptPeerId, status, incomingFrom, acceptIncomingCall])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const peer = await createPeerClient()
        if (!mounted) {
          peer.destroy()
          return
        }
        peerRef.current = peer

        peer.on("open", (id) => {
          if (!mounted) return
          setMyPeerId(id)
          setStatus("ready")
        })

        peer.on("call", (incomingCall) => {
          if (!mounted) return
          incomingCallRef.current = incomingCall
          setIncomingFrom(incomingCall.peer)
          setStatus("incoming")
        })

        peer.on("error", () => {
          if (!mounted) return
          setError("Failed to connect to call service. Try again in a moment.")
          setStatus("failed")
        })
      } catch (peerError) {
        if (!mounted) return
        setError("Unable to initialize video call right now.")
        setStatus("failed")
      }
    }

    init()

    return () => {
      mounted = false
      if (activeCallRef.current) activeCallRef.current.close()
      if (incomingCallRef.current) incomingCallRef.current.close()
      if (peerRef.current) peerRef.current.destroy()
      stopStreamTracks(localStreamRef.current)
      localStreamRef.current = null
    }
  }, [])

  return {
    myPeerId,
    remotePeerId,
    setRemotePeerId,
    localStream,
    remoteStream,
    status,
    statusLabel,
    error,
    incomingFrom,
    isMuted,
    isCameraOff,
    callPeer,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleCamera,
  }
}
