'use client';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { useState } from 'react';
const Example = () => {
  const [files, setFiles] = useState([]);
  const [filePreview, setFilePreview] = useState('');
  const handleDrop = (files) => {
    console.log(files);
    setFiles(files);
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Ensure the result is a string (data URL) before setting preview
        if (typeof e.target?.result === 'string') {
          setFilePreview(e.target.result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };
  return (
    <Dropzone
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg','.webp'] }}
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
              className="absolute top-0 left-0 h-full w-full object-cover"
              src={filePreview}
            />
          </div>
        )}
      </DropzoneContent>
    </Dropzone>
  );
};
export default Example;