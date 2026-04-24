import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const fileType = formData.get('fileType');
    const groupId = formData.get('groupId');

    // Validation
    if (!file || !fileType || !groupId) {
      return Response.json(
        { success: false, error: 'Missing file, fileType, or groupId' },
        { status: 400 }
      );
    }

    // Check file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return Response.json(
        { success: false, error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'group-messages', String(groupId));
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const filename = `${baseName}-${timestamp}-${randomStr}${fileExtension}`;

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to disk
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return public URL
    const mediaUrl = `/uploads/group-messages/${groupId}/${filename}`;

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
