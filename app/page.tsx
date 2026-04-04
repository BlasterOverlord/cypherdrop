"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import { Lock, File as FileIcon, CheckCircle2, Shield, UploadCloud, Copy, RefreshCw } from "lucide-react";
import { generateEncryptionKey, exportKey, calculateFileHash, encryptFile } from "@/utils/crypto";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

type UploadState = "IDLE" | "ENCRYPTING" | "UPLOADING" | "SUCCESS";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("IDLE");
  const [shareLink, setShareLink] = useState<string>("");

  const handleFileDrop = async (droppedFile: File) => {
    setFile(droppedFile);
    setUploadState("ENCRYPTING");
    
    try {
      const fileBuffer = await droppedFile.arrayBuffer();
      const fileHash = await calculateFileHash(fileBuffer);
      const key = await generateEncryptionKey();
      const exportedKeyString = await exportKey(key);
      const encryptedCombinedBuffer = await encryptFile(fileBuffer, key);

      setUploadState("UPLOADING");

      const formData = new FormData();
      const encryptedBlob = new Blob([encryptedCombinedBuffer], { type: "application/octet-stream" });
      
      formData.append("file", encryptedBlob, droppedFile.name);
      formData.append("fileHash", fileHash);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        const url = `${window.location.origin}/download/${data.fileId}#${exportedKeyString}`;
        setShareLink(url);
        setUploadState("SUCCESS");
      } else {
        alert(data.error || "Server upload failed.");
        setUploadState("IDLE");
      }
    } catch (e) {
      console.error(e);
      alert("Encryption or Upload failed. Please try again.");
      setUploadState("IDLE");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Share link copied to clipboard!");
  };

  const reset = () => {
    setFile(null);
    setUploadState("IDLE");
    setShareLink("");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden bg-[#05050A]">
      {/* Animated Matrix Grid Background Simulation */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: "linear-gradient(#0ff0fc 1px, transparent 1px), linear-gradient(90deg, #0ff0fc 1px, transparent 1px)", backgroundSize: "3rem 3rem" }}>
      </div>
      
      {/* Background ambient light */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 left-1/4 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-neon-blue/10 blur-[120px] rounded-full pointer-events-none" 
      />

      <header className="mb-10 sm:mb-12 flex flex-col items-center text-center z-10 w-full max-w-lg mx-auto">
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 py-2 border border-neon-blue/30 rounded-2xl bg-black/40 backdrop-blur-md shadow-[0_0_30px_rgba(15,240,252,0.1)]"
        >
          <Shield size={32} className="text-neon-blue drop-shadow-[0_0_8px_rgba(15,240,252,0.8)]" />
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase text-white">
            Cypher<span className="text-neon-blue text-glow-blue">Drop</span>
          </h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="text-gray-400 font-mono text-xs sm:text-sm max-w-xs sm:max-w-md tracking-wider leading-relaxed"
        >
          Military-grade End-to-End Encryption. Only you control the keys.
        </motion.p>
      </header>

      <section className="w-full max-w-xl sm:max-w-2xl bg-[#0B0D14]/80 backdrop-blur-xl border border-gray-800/80 rounded-[2rem] p-6 sm:p-10 z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <AnimatePresence mode="wait">
          {uploadState === "IDLE" && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.3 }}
            >
              <DropZone onFileDrop={handleFileDrop} />
            </motion.div>
          )}

          {(uploadState === "ENCRYPTING" || uploadState === "UPLOADING") && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center py-10 sm:py-16 text-center"
            >
              <div className="relative mb-10 w-24 h-24 sm:w-32 sm:h-32">
                {/* Abstract Spinner Rings */}
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className={cn(
                    "absolute inset-0 rounded-full border-2 border-t-transparent border-b-transparent",
                    uploadState === "ENCRYPTING" ? "border-l-neon-purple border-r-neon-purple shadow-[0_0_15px_rgba(176,38,255,0.5)]" : "border-l-neon-blue border-r-neon-blue shadow-[0_0_15px_rgba(15,240,252,0.5)]"
                  )}
                />
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className={cn(
                    "absolute inset-2 rounded-full border border-t-transparent border-b-transparent opacity-50",
                    uploadState === "ENCRYPTING" ? "border-l-neon-purple border-r-neon-purple" : "border-l-neon-blue border-r-neon-blue"
                  )}
                />

                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] rounded-full">
                  {uploadState === "ENCRYPTING" ? (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <Lock size={36} className="text-neon-purple sm:w-10 sm:h-10 text-glow-purple" />
                    </motion.div>
                  ) : (
                    <UploadCloud size={36} className="text-neon-blue sm:w-10 sm:h-10 text-glow-blue animate-pulse" />
                  )}
                </div>
              </div>
              
              <h2 className={cn(
                "text-xl sm:text-2xl font-bold mb-6 font-mono uppercase tracking-[0.2em] transition-colors",
                uploadState === "ENCRYPTING" ? "text-neon-purple text-glow-purple" : "text-neon-blue text-glow-blue"
              )}>
                {uploadState === "ENCRYPTING" ? "ENCRYPTING LOCALLY..." : "UPLOADING PAYLOAD..."}
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-6 sm:px-8 py-4 bg-black/60 rounded-xl border border-gray-800/80 font-mono text-xs sm:text-sm text-white w-full max-w-sm mt-4 backdrop-blur-sm">
                <FileIcon size={20} className="text-gray-400 hidden sm:block" />
                <span className="truncate w-full text-center sm:max-w-[200px] text-gray-300 font-semibold">{file?.name}</span>
                <span className="text-gray-500 whitespace-nowrap px-3 py-1 bg-gray-900 rounded-md">
                  {(file?.size ? (file.size / 1024 / 1024).toFixed(2) : "0.00")} MB
                </span>
              </div>
            </motion.div>
          )}

          {uploadState === "SUCCESS" && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-6 sm:py-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", bounce: 0.5 }}
                className="bg-neon-green/10 p-4 rounded-full mb-6 border border-neon-green/20 glow-green"
              >
                <CheckCircle2 size={56} className="text-neon-green sm:w-16 sm:h-16" />
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-wider text-white">Vault Secured</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-10 max-w-sm leading-relaxed px-4">
                Payload is locked. The key is in this link. <span className="text-red-400 font-bold block mt-1">If lost, recovery is mathematically impossible.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center w-full max-w-lg bg-[#05050A] border border-neon-green/40 shadow-[0_0_20px_rgba(57,255,20,0.1)] rounded-xl p-2 mb-8 sm:mb-10 gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  className="bg-transparent w-full outline-none text-neon-green font-mono text-xs sm:text-sm px-4 py-3 text-center sm:text-left selection:bg-neon-green/30"
                />
                <button 
                  onClick={copyToClipboard}
                  className="w-full sm:w-auto bg-neon-green/20 hover:bg-neon-green hover:text-black text-neon-green px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm shadow-[0_0_10px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.5)]"
                >
                  <Copy size={18} />
                  Copy
                </button>
              </div>

              <button 
                onClick={reset}
                className="group flex items-center gap-2 text-xs sm:text-sm text-gray-500 hover:text-white uppercase tracking-widest transition-all font-mono py-2 px-4 rounded-lg hover:bg-white/5"
              >
                <RefreshCw size={16} className="group-hover:-rotate-180 transition-transform duration-500" />
                Encrypt Another Payload
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
