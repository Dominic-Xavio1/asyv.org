import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import path from 'path';
import { MAX_CHAT_FILE_BYTES, FILE_TOO_HEAVY_MESSAGE, detectChatFileType } from '@/lib/chatMedia';

export const runtime = 'nodejs';

/**
 * Fallback multipart parser for binary video/media buffers when Web API request.formData() fails.
 */
function parseMultipartBuffer(arrayBuffer, boundary) {
  const buffer = Buffer.from(arrayBuffer);
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const result = { fields: {}, file: null };

  let start = 0;
  while (start < buffer.length) {
    const boundaryIdx = buffer.indexOf(boundaryBuf, start);
    if (boundaryIdx === -1) break;

    const nextStart = boundaryIdx + boundaryBuf.length;
    if (buffer[nextStart] === 0x2d && buffer[nextStart + 1] === 0x2d) {
      break;
    }

    let headersStart = nextStart;
    if (buffer[headersStart] === 0x0d && buffer[headersStart + 1] === 0x0a) {
      headersStart += 2;
    }

    const headersEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), headersStart);
    if (headersEnd === -1) break;

    const headersStr = buffer.toString('utf8', headersStart, headersEnd);
    const bodyStart = headersEnd + 4;

    const nextBoundaryIdx = buffer.indexOf(boundaryBuf, bodyStart);
    if (nextBoundaryIdx === -1) break;

    let bodyEnd = nextBoundaryIdx;
    if (buffer[bodyEnd - 2] === 0x0d && buffer[bodyEnd - 1] === 0x0a) {
      bodyEnd -= 2;
    }

    const bodyBuf = buffer.subarray(bodyStart, bodyEnd);
    const nameMatch = headersStr.match(/name="([^"]+)"/i);
    const filenameMatch = headersStr.match(/filename="([^"]+)"/i);
    const contentTypeMatch = headersStr.match(/content-type:\s*([^\r\n]+)/i);

    if (nameMatch) {
      const fieldName = nameMatch[1];
      if (filenameMatch) {
        result.file = {
          name: filenameMatch[1],
          type: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream',
          buffer: bodyBuf,
          size: bodyBuf.length,
        };
      } else {
        result.fields[fieldName] = bodyBuf.toString('utf8');
      }
    }

    start = nextBoundaryIdx;
  }

  return result;
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const contentLength = Number(request.headers.get('content-length') || 0);

    if (contentLength > MAX_CHAT_FILE_BYTES) {
      return Response.json(
        { success: false, error: FILE_TOO_HEAVY_MESSAGE },
        { status: 413 }
      );
    }

    let file = null;
    let fileType = null;
    let groupId = null;
    let fileBuffer = null;
    let fileName = null;

    try {
      const formData = await request.formData();
      file = formData.get('file');
      fileType = formData.get('fileType');
      groupId = formData.get('groupId');
      if (file && typeof file.arrayBuffer === 'function') {
        fileBuffer = Buffer.from(await file.arrayBuffer());
        fileName = file.name;
      }
    } catch (parseError) {
      console.warn('request.formData() failed, falling back to multipart buffer parser:', parseError.message);
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;

      if (boundary) {
        const rawBuffer = await request.arrayBuffer();
        const parsed = parseMultipartBuffer(rawBuffer, boundary.trim());
        if (parsed.file) {
          file = parsed.file;
          fileBuffer = parsed.file.buffer;
          fileName = parsed.file.name;
          fileType = parsed.fields.fileType || detectChatFileType({ name: fileName, type: parsed.file.type });
          groupId = parsed.fields.groupId || '';
        }
      }
    }

    if (!file || !fileBuffer || !fileType || !groupId) {
      return Response.json(
        { success: false, error: 'Missing file, fileType, or groupId' },
        { status: 400 }
      );
    }

    if (fileBuffer.length > MAX_CHAT_FILE_BYTES) {
      return Response.json(
        { success: false, error: FILE_TOO_HEAVY_MESSAGE },
        { status: 413 }
      );
    }

    const safeGroupId = String(groupId).replace(/[^a-zA-Z0-9_-]/g, '') || 'chat';
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'group-messages', safeGroupId);
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExtension = path.extname(fileName || 'file');
    const baseName = path.basename(fileName || 'file', fileExtension).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${baseName}-${timestamp}-${randomStr}${fileExtension}`;

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, fileBuffer);

    const mediaUrl = `/uploads/group-messages/${safeGroupId}/${filename}`;

    return Response.json(
      {
        success: true,
        mediaUrl: mediaUrl,
        filename: filename,
        fileType: fileType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('File upload error:', error);
    return Response.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}

