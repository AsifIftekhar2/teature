"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      setSelectedFile(null);
      setFileType("");
      setError("");
      return;
    }

    // Validate file type
    const fileType = file.type;
    const isValidAudio = fileType.startsWith("audio/");
    const isValidVideo = fileType.startsWith("video/");
    const isValidText = fileType.startsWith("text/") && file.name.endsWith(".txt");

    if (!isValidAudio && !isValidVideo && !isValidText) {
      setError("Please upload an audio, video, or text file.");
      setSelectedFile(null);
      setFileType("");
      return;
    }

    // Validate file size limits
    const fileSize = file.size;
    const maxAudioSize = 100 * 1024 * 1024; // 100 MB
    const maxVideoSize = 100 * 1024 * 1024; // 100 MB
    const maxTextSize = 2 * 1024 * 1024; // 2 MB

    if (isValidAudio && fileSize > maxAudioSize) {
      setError("Audio file size must be 100 MB or less.");
      setSelectedFile(null);
      setFileType("");
      return;
    }

    if (isValidVideo && fileSize > maxVideoSize) {
      setError("Video file size must be 100 MB or less.");
      setSelectedFile(null);
      setFileType("");
      return;
    }

    if (isValidText && fileSize > maxTextSize) {
      setError("Text file size must be 2 MB or less.");
      setSelectedFile(null);
      setFileType("");
      return;
    }

    setError("");
    setSelectedFile(file);
    
    if (isValidAudio) {
      setFileType("audio");
    } else if (isValidVideo) {
      setFileType("video");
    } else {
      setFileType("text");
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Upload Your Lecture Transcript
        </h1>
        
        <div className="space-y-6">
          {/* Upload Button */}
          <div className="text-center">
            <button
              onClick={handleButtonClick}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept="audio/*,video/*,text/*,.txt"
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* File Information */}
          {selectedFile && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Selected File:</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {selectedFile.name}</p>
                <p><strong>Type:</strong> {fileType}</p>
                <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                <p><strong>Last Modified:</strong> {new Date(selectedFile.lastModified).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Supported File Types:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Audio:</strong> Any audio file (mp3, wav, m4a, etc.) [100 MB max]</li>
              <li><strong>Video:</strong> Any video file (mp4, avi, mov, etc.) [100 MB max]</li>
              <li><strong>Text:</strong> Text files (.txt) [2 MB max]</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
