import { UploadCloud } from "lucide-react";
import { useCallback, useState } from "react";

export default function DropZone({ onFileDrop }: { onFileDrop: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileDrop(files[0]);
      }
    },
    [onFileDrop]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileDrop(files[0]);
      }
    },
    [onFileDrop]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full min-h-[250px] sm:min-h-[300px] p-6 sm:p-8 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out cursor-pointer ${
        isDragging
          ? "border-neon-purple bg-neon-purple/10 glow-purple"
          : "border-gray-600 hover:border-neon-blue bg-cyber-gray hover:bg-cyber-gray/80"
      }`}
    >
      <input
        type="file"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Upload file"
      />
      <UploadCloud
        size={56}
        className={`mb-4 sm:mb-6 transition-colors duration-300 ${
          isDragging ? "text-neon-purple" : "text-gray-400 group-hover:text-neon-blue"
        }`}
      />
      <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-wide text-center uppercase">
        {isDragging ? "DROP TO ENCRYPT" : "DRAG & DROP SECURE FILES"}
      </h3>
      <p className="text-gray-400 text-center text-xs sm:text-sm">
        or click to browse from your device
      </p>
      
      <div className="mt-4 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700/50 text-[10px] sm:text-xs text-gray-500 font-mono tracking-widest uppercase">
        Max file size: 100 MB
      </div>
    </div>
  );
}
