import { UploadCloud, Fingerprint } from "lucide-react";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[250px] sm:min-h-[300px] p-6 sm:p-8 border-2 border-dashed rounded-2xl transition-all duration-500 ease-out cursor-pointer overflow-hidden group",
        isDragging
          ? "border-neon-purple bg-neon-purple/10 glow-purple scale-[1.02]"
          : "border-gray-700/50 hover:border-neon-blue/80 bg-gray-900/40 hover:bg-gray-800/60 backdrop-blur-sm"
      )}
    >
      {/* Background ambient glow setup */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b from-transparent to-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        isDragging && "to-neon-purple/10 opacity-100"
      )} />

      <input
        type="file"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        aria-label="Upload file"
      />
      
      <motion.div 
        animate={{ y: isDragging ? -10 : 0 }}
        className="relative z-10 mb-4 sm:mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-950/80 border border-gray-800/80 group-hover:border-neon-blue/50 group-hover:shadow-[0_0_20px_rgba(15,240,252,0.3)] transition-all duration-500"
      >
        <UploadCloud
          size={32}
          className={cn(
            "transition-colors duration-300 sm:w-10 sm:h-10",
            isDragging ? "text-neon-purple" : "text-gray-400 group-hover:text-neon-blue"
          )}
        />
      </motion.div>

      <h3 className={cn(
        "text-xl sm:text-2xl font-bold mb-2 tracking-wider text-center z-10 transition-colors uppercase",
        isDragging ? "text-white text-glow-purple" : "text-gray-200 group-hover:text-glow-blue"
      )}>
        {isDragging ? "Drop to Encrypt" : "Drag & Drop Files"}
      </h3>
      <p className="text-gray-500 text-center text-xs sm:text-sm z-10 font-mono tracking-wide px-4">
        or click anywhere to browse local storage
      </p>
      
      <div className="mt-8 px-4 py-2 border border-neon-blue/20 text-neon-blue rounded-lg bg-neon-blue/5 text-[10px] sm:text-xs font-mono uppercase tracking-widest flex items-center gap-2 z-10 backdrop-blur-md">
        <Fingerprint size={14} className="animate-pulse" />
        Zero-Knowledge Architecture
      </div>
    </motion.div>
  );
}
