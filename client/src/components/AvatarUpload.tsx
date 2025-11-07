import { useState } from 'react';

interface AvatarUploadProps {
  onAvatarChange: (avatarUrl: string) => void;
  currentAvatar?: string;
}

export default function AvatarUpload({ onAvatarChange, currentAvatar }: AvatarUploadProps): JSX.Element {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    // This is a placeholder implementation
    // In a real app, you would upload the file to a server and get back a URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onAvatarChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Profile Photo
      </label>
      
      <div className="flex items-center space-x-6">
        <div className="shrink-0">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="h-24 w-24 object-cover rounded-full"
            />
          ) : (
            <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
        
        <label className="block">
          <span className="sr-only">Choose profile photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
        </label>
      </div>
      
      <p className="text-sm text-gray-500">
        Upload a photo to help others recognize you. JPG, PNG or GIF. Max size 2MB.
      </p>
    </div>
  );
}