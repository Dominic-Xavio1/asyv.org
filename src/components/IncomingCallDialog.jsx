"use client"

import { useEffect, useState } from "react"
import { Phone, PhoneOff, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CALL_OFFER_TTL_MS } from "@/lib/videocall/callConstants"

export default function IncomingCallDialog({ incomingCall, onAccept, onDecline }) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(CALL_OFFER_TTL_MS / 1000))

  useEffect(() => {
    if (!incomingCall?.expiresAt) return undefined

    const updateRemaining = () => {
      const remainingMs = incomingCall.expiresAt - Date.now()
      const nextSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
      setSecondsLeft(nextSeconds)
      if (remainingMs <= 0) onDecline?.({ expired: true })
    }

    updateRemaining()
    const intervalId = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(intervalId)
  }, [incomingCall, onDecline])

  if (!incomingCall) return null

  const isAudio = incomingCall.mode === "audio"

  return (
    <Dialog open onOpenChange={(open) => !open && onDecline?.()}>
      <DialogContent className="z-[100] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAudio ? <Phone className="size-5 text-green-500" /> : <Video className="size-5 text-green-500" />}
            Incoming {isAudio ? "voice" : "video"} call
          </DialogTitle>
          <DialogDescription>
            {incomingCall.callerName} is calling you. This request expires in {secondsLeft}s.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => onAccept?.(incomingCall)} className="bg-green-600 hover:bg-green-700">
            <Phone className="size-4" />
            Accept
          </Button>
          <Button onClick={() => onDecline?.()} variant="outline">
            <PhoneOff className="size-4" />
            Decline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
