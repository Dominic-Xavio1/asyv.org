"use client"

import { useEffect, useRef } from "react"
import { Copy, Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

export default function VideoCallPage() {
  const searchParams = useSearchParams()
  const targetName = searchParams.get("targetName") || "Friend"
  const mode = searchParams.get("mode") || "video"

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
  } = usePeerCall()

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

  const canCall = status !== "initializing" && status !== "calling" && remotePeerId.trim().length > 0
  const canControlMedia = Boolean(localStream)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 mt-18">
      <Card className="border-zinc-200/80 bg-background/90">
        <CardHeader>
          <CardTitle className="text-xl">1-to-1 Video Call</CardTitle>
          <CardDescription>
            {mode === "audio" ? "Voice call" : "Video call"} with {targetName}. Copy your ID, send it in chat, and call after {targetName} pastes it.
          </CardDescription>
        </CardHeader>
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

          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">Status: </span>
            {statusLabel}
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </CardContent>
      </Card>

      {status === "incoming" ? (
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
        <VideoPanel title="Friend" stream={remoteStream} muted={false} />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-center gap-2 py-5">
          <Button onClick={toggleMute} variant="outline" disabled={!canControlMedia}>
            {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          <Button onClick={toggleCamera} variant="outline" disabled={!canControlMedia}>
            {isCameraOff ? <VideoOff className="size-4" /> : <Video className="size-4" />}
            {isCameraOff ? "Camera On" : "Camera Off"}
          </Button>
          <Button onClick={endCall} variant="destructive" disabled={!remoteStream && status !== "calling"}>
            <PhoneOff className="size-4" />
            End Call
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
