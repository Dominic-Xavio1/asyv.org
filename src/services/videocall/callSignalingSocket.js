import { CALL_OFFER_TTL_MS, CALL_SIGNALING_EVENTS } from "../../lib/videocall/callConstants"

const activeOffers = new Map()

const isOfferExpired = (offer) => Date.now() - offer.createdAt > CALL_OFFER_TTL_MS

const clearOffer = (callId) => {
  activeOffers.delete(callId)
}

export function setupCallSignalingHandlers(socket, io) {
  socket.on(CALL_SIGNALING_EVENTS.offer, (payload, callback) => {
    try {
      const {
        callId,
        callerId,
        calleeId,
        callerPeerId,
        callerName,
        conversationId,
        mode = "video",
      } = payload || {}

      if (!callId || !callerId || !calleeId || !callerPeerId) {
        callback?.({ success: false, error: "Missing required call fields" })
        return
      }

      if (String(callerId) === String(calleeId)) {
        callback?.({ success: false, error: "Cannot call yourself" })
        return
      }

      const offer = {
        callId: String(callId),
        callerId: String(callerId),
        calleeId: String(calleeId),
        callerPeerId: String(callerPeerId),
        callerName: callerName || "Someone",
        conversationId: conversationId ? String(conversationId) : null,
        mode: mode === "audio" ? "audio" : "video",
        createdAt: Date.now(),
      }

      activeOffers.set(offer.callId, offer)

      io.to(`user_${offer.calleeId}`).emit(CALL_SIGNALING_EVENTS.incoming, {
        callId: offer.callId,
        callerId: offer.callerId,
        callerName: offer.callerName,
        callerPeerId: offer.callerPeerId,
        conversationId: offer.conversationId,
        mode: offer.mode,
        expiresAt: offer.createdAt + CALL_OFFER_TTL_MS,
      })

      callback?.({ success: true })

      setTimeout(() => {
        const current = activeOffers.get(offer.callId)
        if (!current || current.createdAt !== offer.createdAt) return

        clearOffer(offer.callId)
        io.to(`user_${offer.callerId}`).emit(CALL_SIGNALING_EVENTS.expired, { callId: offer.callId })
        io.to(`user_${offer.calleeId}`).emit(CALL_SIGNALING_EVENTS.expired, { callId: offer.callId })
      }, CALL_OFFER_TTL_MS)
    } catch (error) {
      console.error("call_offer error:", error)
      callback?.({ success: false, error: error.message || "Failed to send call offer" })
    }
  })

  socket.on(CALL_SIGNALING_EVENTS.accept, (payload, callback) => {
    try {
      const { callId, callerId, calleeId, calleePeerId } = payload || {}

      if (!callId || !callerId || !calleeId || !calleePeerId) {
        callback?.({ success: false, error: "Missing required accept fields" })
        return
      }

      const offer = activeOffers.get(String(callId))
      if (!offer) {
        callback?.({ success: false, error: "Call offer not found or already handled" })
        return
      }

      if (isOfferExpired(offer)) {
        clearOffer(String(callId))
        callback?.({ success: false, error: "Call offer expired" })
        return
      }

      if (
        String(offer.callerId) !== String(callerId) ||
        String(offer.calleeId) !== String(calleeId)
      ) {
        callback?.({ success: false, error: "Call participants do not match" })
        return
      }

      clearOffer(String(callId))

      io.to(`user_${offer.callerId}`).emit(CALL_SIGNALING_EVENTS.accepted, {
        callId: offer.callId,
        calleeId: String(calleeId),
        calleePeerId: String(calleePeerId),
      })

      callback?.({ success: true })
    } catch (error) {
      console.error("call_accept error:", error)
      callback?.({ success: false, error: error.message || "Failed to accept call" })
    }
  })

  const notifyCallEnded = (eventName, payload) => {
    const { callId, callerId, calleeId, reason } = payload || {}
    if (!callId || !callerId || !calleeId) return

    clearOffer(String(callId))

    io.to(`user_${callerId}`).emit(eventName, { callId, calleeId, reason })
    io.to(`user_${calleeId}`).emit(eventName, { callId, callerId, reason })
  }

  socket.on(CALL_SIGNALING_EVENTS.reject, (payload, callback) => {
    try {
      notifyCallEnded(CALL_SIGNALING_EVENTS.rejected, { ...payload, reason: "rejected" })
      callback?.({ success: true })
    } catch (error) {
      console.error("call_reject error:", error)
      callback?.({ success: false, error: error.message || "Failed to reject call" })
    }
  })

  socket.on(CALL_SIGNALING_EVENTS.cancel, (payload, callback) => {
    try {
      notifyCallEnded(CALL_SIGNALING_EVENTS.cancelled, { ...payload, reason: "cancelled" })
      callback?.({ success: true })
    } catch (error) {
      console.error("call_cancel error:", error)
      callback?.({ success: false, error: error.message || "Failed to cancel call" })
    }
  })
}
