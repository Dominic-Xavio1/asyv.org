'use client';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { useState, forwardRef, useImperativeHandle } from 'react';

const GroupImageDropzone = forwardRef((props, ref) => {
  const [files, setFiles] = useState([]);
  const [filePreview, setFilePreview] = useState('');

  useImperativeHandle(ref, () => ({
    getFile: () => files[0] || null,
    reset: () => {
      setFiles([]);
      setFilePreview('');
    }
  }));

  const handleDrop = (droppedFiles) => {
    setFiles(droppedFiles);
    if (droppedFiles.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setFilePreview(e.target.result);
        }
      };
      reader.readAsDataURL(droppedFiles[0]);
    }
  };

  return (
    <Dropzone
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
      onDrop={handleDrop}
      onError={console.error}
      src={files}
    >
      <DropzoneEmptyState />
      <DropzoneContent>
        {filePreview && (
          <div className="relative h-[102px] w-full">
            <img
              alt="Preview"
              className="absolute top-0 left-0 h-full w-full object-cover rounded"
              src={filePreview}
            />
          </div>
        )}
      </DropzoneContent>
    </Dropzone>
  );
});

GroupImageDropzone.displayName = 'GroupImageDropzone';

export default GroupImageDropzone;
