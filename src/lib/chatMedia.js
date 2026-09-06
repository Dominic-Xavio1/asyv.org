export const MAX_CHAT_FILE_BYTES = 50 * 1024 * 1024;
export const FILE_TOO_HEAVY_MESSAGE = "This file is too heavy.";

export function isFileTooHeavy(file) {
  return Boolean(file && typeof file.size === "number" && file.size > MAX_CHAT_FILE_BYTES);
}

export function detectChatFileType(file, pickerType = "document") {
  const mime = file?.type || "";
  const name = file?.name || "";

  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("image/")) return "image";
  if (/\.(mp4|mov|avi|mkv|m4v)$/i.test(name)) return "video";
  if (/\.webm$/i.test(name)) return pickerType === "audio" ? "audio" : "video";
  if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(name)) return "audio";
  if (/\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(name)) return "image";
  if (pickerType === "audio" || pickerType === "image") return pickerType;
  return pickerType || "document";
}
