"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const DEFAULT_MIME = "audio/webm";
const FALLBACK_MIME = "audio/ogg";
const FILENAME_PREFIX = "voice-note";

/**
 * Returns a MIME type supported by MediaRecorder for audio (prefer webm for small size).
 */
function getSupportedAudioMimeType() {
  if (typeof window === "undefined" || !window.MediaRecorder) return null;
  const prefer = [DEFAULT_MIME, FALLBACK_MIME, "audio/mp4"];
  for (const mime of prefer) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

/**
 * Returns file extension for the given MIME type.
 */
function getExtensionForMime(mime) {
  if (!mime) return ".webm";
  if (mime.includes("ogg")) return ".ogg";
  if (mime.includes("mp4")) return ".m4a";
  return ".webm";
}

/**
 * Production-ready voice recording hook.
 * Handles permissions, MediaRecorder, errors, and returns a File suitable for upload.
 * @returns {{
 *   isSupported: boolean,
 *   status: 'idle'|'requesting'|'recording'|'stopped'|'error',
 *   error: string|null,
 *   startRecording: () => Promise<void>,
 *   stopRecording: () => Promise<void>,
 *   reset: () => void,
 *   durationSec: number,
 *   recordedFile: File|null,
 *   recordedBlob: Blob|null
 * }}
 */
export function useVoiceRecorder() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [durationSec, setDurationSec] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedFile, setRecordedFile] = useState(null);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!window.MediaRecorder;

  const clearDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearDurationTimer();
    stopStream();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch (_) {}
      recorderRef.current = null;
    }
    chunksRef.current = [];
    setStatus("idle");
    setError(null);
    setDurationSec(0);
    setRecordedBlob(null);
    setRecordedFile(null);
  }, [clearDurationTimer, stopStream]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Voice recording is not supported in this browser.");
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedAudioMimeType() || DEFAULT_MIME;
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        clearDurationTimer();
        stopStream();
        if (chunksRef.current.length === 0) {
          setStatus("idle");
          setError("Recording was too short or failed.");
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const ext = getExtensionForMime(recorder.mimeType || mimeType);
        const file = new File([blob], `${FILENAME_PREFIX}${ext}`, {
          type: blob.type,
          lastModified: Date.now(),
        });
        setRecordedFile(file);
        setStatus("stopped");
      };

      recorder.onerror = (e) => {
        setError(e.error?.message || "Recording failed.");
        setStatus("error");
        clearDurationTimer();
        stopStream();
      };

      recorder.start(200);
      startTimeRef.current = Date.now();
      setStatus("recording");
      setDurationSec(0);

      durationIntervalRef.current = setInterval(() => {
        setDurationSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      stopStream();
      clearDurationTimer();
      const message =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was denied."
          : err.name === "NotFoundError"
            ? "No microphone found."
            : err.message || "Could not start recording.";
      setError(message);
      setStatus("error");
    }
  }, [isSupported, clearDurationTimer, stopStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      clearDurationTimer();
      stopStream();
    };
  }, [clearDurationTimer, stopStream]);

  return {
    isSupported,
    status,
    error,
    startRecording,
    stopRecording,
    reset,
    durationSec,
    recordedBlob,
    recordedFile,
  };
}
