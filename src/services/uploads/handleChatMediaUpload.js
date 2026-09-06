import multer from "multer";
import { mkdir, rename, copyFile, unlink } from "fs/promises";
import { mkdirSync } from "fs";
import { join, extname, basename } from "path";
import { tmpdir } from "os";
import {
  MAX_CHAT_FILE_BYTES,
  FILE_TOO_HEAVY_MESSAGE,
} from "../../lib/chatMedia.js";

const tempDir = join(tmpdir(), "asyv-chat-uploads");
mkdirSync(tempDir, { recursive: true });

const upload = multer({
  dest: tempDir,
  limits: { fileSize: MAX_CHAT_FILE_BYTES },
});

function sendJson(res, status, body) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function moveUploadedFile(fromPath, toPath) {
  try {
    await rename(fromPath, toPath);
  } catch (error) {
    if (error.code !== "EXDEV") throw error;
    await copyFile(fromPath, toPath);
    await unlink(fromPath);
  }
}

/**
 * Parse multipart chat media on the Node HTTP server.
 * Next.js request.formData() fails for large videos on this custom server.
 */
export function handleChatMediaUpload(req, res) {
  return new Promise((resolve) => {
    upload.single("file")(req, res, async (err) => {
      const finish = (status, body) => {
        sendJson(res, status, body);
        resolve();
      };

      try {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return finish(413, { success: false, error: FILE_TOO_HEAVY_MESSAGE });
          }
          console.error("File upload error:", err);
          return finish(400, {
            success: false,
            error: err.message || "File upload failed",
          });
        }

        const file = req.file;
        const fileType = req.body?.fileType;
        const groupId = req.body?.groupId;

        if (!file || !fileType || !groupId) {
          if (file?.path) await unlink(file.path).catch(() => {});
          return finish(400, {
            success: false,
            error: "Missing file, fileType, or groupId",
          });
        }

        if (file.size > MAX_CHAT_FILE_BYTES) {
          await unlink(file.path).catch(() => {});
          return finish(413, { success: false, error: FILE_TOO_HEAVY_MESSAGE });
        }

        const safeId = String(groupId).replace(/[^a-zA-Z0-9_-]/g, "") || "chat";
        const uploadDir = join(
          process.cwd(),
          "public",
          "uploads",
          "group-messages",
          safeId
        );
        await mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const originalName = file.originalname || file.filename || "file";
        const fileExtension = extname(originalName);
        const baseName =
          basename(originalName, fileExtension).replace(/[^a-zA-Z0-9._-]/g, "_") ||
          "file";
        const filename = `${baseName}-${timestamp}-${randomStr}${fileExtension}`;
        const destPath = join(uploadDir, filename);

        await moveUploadedFile(file.path, destPath);

        return finish(200, {
          success: true,
          mediaUrl: `/uploads/group-messages/${safeId}/${filename}`,
          filename,
          fileType,
        });
      } catch (error) {
        console.error("File upload error:", error);
        if (req.file?.path) await unlink(req.file.path).catch(() => {});
        return finish(500, {
          success: false,
          error: error.message || "File upload failed",
        });
      }
    });
  });
}
