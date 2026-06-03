"use client"
import {Suspense} from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Copy, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCallSignaling } from "@/lib/videocall/useCallSignaling"
import { getStoredUser } from "@/lib/videocall/callUser"
import { usePeerCall } from "@/lib/videocall/usePeerCall"

function VideoPanel({ title, stream, muted }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.srcObject = stream || null
  }, [stream])

  return (
    <div className="relative overflow-hidden rounded-xl border bg-black/95">
      <div className="aspect-video w-full">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Waiting for {title.toLowerCase()} video...
          </div>
        )}
      </div>
      <div className="absolute left-3 bottom-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">{title}</div>
    </div>
  )
}

 function VideoCallPageContent() {
  const searchParams = useSearchParams()
  const targetName = searchParams.get("targetName") || "Friend"
  const mode = searchParams.get("mode") === "audio" ? "audio" : "video"
  const isAutoCall = searchParams.get("auto") === "1"
  const role = searchParams.get("role")
  const callId = searchParams.get("callId")
  const targetUserId = searchParams.get("targetUserId")
  const callerId = searchParams.get("callerId")
  const callerPeerId = searchParams.get("callerPeerId") || ""
  const conversationId = searchParams.get("conversationId")

  const [currentUser, setCurrentUser] = useState(null)
  const callEndedRef = useRef(false)

  useEffect(() => {
    setCurrentUser(getStoredUser())
  }, [])

  const isCaller = isAutoCall && role === "caller"
  const isCallee = isAutoCall && role === "callee"

  const {
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
  } = usePeerCall({
    mediaMode: mode,
    autoAcceptPeerId: isCallee ? callerPeerId : "",
  })

  const handleCallEnded = useCallback(
    (message) => {
      if (callEndedRef.current) return
      callEndedRef.current = true
      if (message) toast.error(message)
      endCall()
      if (isAutoCall) {
        window.setTimeout(() => window.close(), 1200)
      }
    },
    [endCall, isAutoCall]
  )

  const handleRemoteAccepted = useCallback(
    async ({ calleePeerId }) => {
      if (!calleePeerId) return
      try {
        setRemotePeerId(calleePeerId)
        await callPeer(calleePeerId)
      } catch {
        handleCallEnded("Could not connect the call")
      }
    },
    [callPeer, handleCallEnded, setRemotePeerId]
  )

  const { emitCancel } = useCallSignaling({
    enabled: isAutoCall && Boolean(currentUser?.id && callId),
    role: isCaller ? "caller" : isCallee ? "callee" : null,
    callId,
    userId: currentUser?.id,
    targetUserId: isCaller ? targetUserId : callerId,
    conversationId,
    mode,
    myPeerId,
    callerPeerId,
    callerId,
    onRemoteAccepted: handleRemoteAccepted,
    onRemoteRejected: () => handleCallEnded("Call declined"),
    onRemoteCancelled: () => handleCallEnded("Call cancelled"),
    onRemoteExpired: () => handleCallEnded("Call timed out after 50 seconds"),
  })

  const copyMyId = async () => {
    if (!myPeerId) return
    await navigator.clipboard.writeText(myPeerId)
    toast.success("Call ID copied")
  }

  const startCall = async () => {
    try {
      await callPeer(remotePeerId)
    } catch {
      toast.error("Could not start call")
    }
  }

  const handleEndCall = () => {
    if (isAutoCall && (status === "calling" || status === "ready") && !callEndedRef.current) {
      emitCancel()
    }
    endCall()
  }

  const canCall = status !== "initializing" && status !== "calling" && remotePeerId.trim().length > 0
  const canControlMedia = Boolean(localStream)
  const showManualSetup = !isAutoCall
  const showRinging = isCaller && isAutoCall && Boolean(myPeerId) && !remoteStream && status === "ready"
  const pageDescription = useMemo(() => {
    if (!isAutoCall) {
      return `${mode === "audio" ? "Voice call" : "Video call"} with ${targetName}. Copy your ID, send it in chat, and call after ${targetName} pastes it.`
    }
    if (isCaller) {
      return `Calling ${targetName}. Waiting for them to accept (up to 50 seconds).`
    }
    return `Joining ${mode === "audio" ? "voice" : "video"} call with ${targetName}.`
  }, [isAutoCall, isCaller, mode, targetName])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 mt-18">
      <Card className="border-zinc-200/80 bg-background/90">
        <CardHeader>
          <CardTitle className="text-xl">1-to-1 {mode === "audio" ? "Voice" : "Video"} Call</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        {showManualSetup ? (
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Your call ID</p>
                <div className="flex gap-2">
                  <Input value={myPeerId} readOnly placeholder="Generating your ID..." />
                  <Button onClick={copyMyId} disabled={!myPeerId} variant="outline">
                    <Copy className="size-4" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Connect to friend</p>
                <div className="flex gap-2">
                  <Input
                    value={remotePeerId}
                    onChange={(event) => setRemotePeerId(event.target.value)}
                    placeholder="Paste friend call ID"
                  />
                  <Button onClick={startCall} disabled={!canCall}>
                    <Phone className="size-4" />
                    {mode === "audio" ? "Start voice call" : "Start call"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        ) : null}
        <CardContent className={showManualSetup ? "pt-0 space-y-4" : "space-y-4"}>
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">Status: </span>
            {showRinging ? `Ringing ${targetName}...` : statusLabel}
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </CardContent>
      </Card>

      {status === "incoming" && !isCallee ? (
        <Card className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/30">
          <CardContent className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
            <p className="text-sm md:text-base">
              Incoming call from <span className="font-semibold">{incomingFrom}</span>
            </p>
            <div className="flex gap-2">
              <Button onClick={acceptIncomingCall}>
                <Phone className="size-4" />
                Accept
              </Button>
              <Button onClick={rejectIncomingCall} variant="outline">
                <PhoneOff className="size-4" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <VideoPanel title="You" stream={localStream} muted />
        <VideoPanel title={targetName} stream={remoteStream} muted={false} />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-center gap-2 py-5">
          <Button onClick={toggleMute} variant="outline" disabled={!canControlMedia}>
            {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          {mode !== "audio" ? (
            <Button onClick={toggleCamera} variant="outline" disabled={!canControlMedia}>
              {isCameraOff ? <VideoOff className="size-4" /> : <Video className="size-4" />}
              {isCameraOff ? "Camera On" : "Camera Off"}
            </Button>
          ) : null}
          <Button onClick={handleEndCall} variant="destructive" disabled={!remoteStream && status !== "calling" && status !== "inCall"}>
            <PhoneOff className="size-4" />
            End Call
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


export default function VideoCallPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <VideoCallPageContent />
    </Suspense>
  )
}