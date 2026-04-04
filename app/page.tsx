"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import toast from "react-hot-toast";
import { Lock, File as FileIcon, CheckCircle2, Shield, UploadCloud, Copy, Clock } from "lucide-react";
import { generateEncryptionKey, exportKey, calculateFileHash, encryptFile } from "@/utils/crypto";

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
        toast.error(data.error || "Server upload failed.");
        setUploadState("IDLE");
      }
    } catch (e) {
      console.error(e);
      toast.error("Encryption or Upload failed. Is the server running?");
      setUploadState("IDLE");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied to clipboard!");
  };

  const reset = () => {
    setFile(null);
    setUploadState("IDLE");
    setShareLink("");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-cyber-dark">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-neon-purple/10 sm:bg-neon-purple/5 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none"></div>

      <header className="mb-8 flex flex-col items-center text-center z-10 w-full px-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <Shield size={32} className="text-neon-purple sm:w-10 sm:h-10" />
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-white">
            Cypher<span className="text-neon-blue text-glow-blue">Drop</span>
          </h1>
        </div>
        <p className="text-gray-400 font-mono text-xs sm:text-sm max-w-sm sm:max-w-md tracking-wider">
          End-to-End Encrypted File Transfer. The server never sees your keys.
        </p>
        <div className="mt-4 px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-500/30 text-blue-400 rounded bg-blue-500/10 text-[10px] sm:text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse shrink-0"></span>
          Zero Knowledge Architecture
        </div>
      </header>

      <section className="w-full max-w-xl sm:max-w-2xl bg-cyber-gray/90 backdrop-blur-md border border-gray-800 rounded-2xl p-6 sm:p-8 z-10 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none"></div>
        {uploadState === "IDLE" && (
          <>
            <DropZone onFileDrop={handleFileDrop} />
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-xs sm:text-sm">
              <Clock size={14} className="text-neon-purple" />
              <p>Uploaded files will be deleted automatically after 24 hours.</p>
            </div>
          </>
        )}

        {(uploadState === "ENCRYPTING" || uploadState === "UPLOADING") && (
          <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center text-white">
            <div className="relative mb-6 sm:mb-8">
              <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-t-transparent animate-spin ${uploadState === "ENCRYPTING" ? "border-neon-purple glow-purple" : "border-neon-blue glow-blue"}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {uploadState === "ENCRYPTING" ? (
                  <Lock size={24} className="text-neon-purple sm:w-8 sm:h-8" />
                ) : (
                  <UploadCloud size={24} className="text-neon-blue sm:w-8 sm:h-8" />
                )}
              </div>
            </div>
            
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 font-mono uppercase tracking-widest ${uploadState === "ENCRYPTING" ? "text-glow-purple text-neon-purple" : "text-glow-blue text-neon-blue"}`}>
              {uploadState === "ENCRYPTING" ? "Encrypting Locally..." : "Uploading File..."}
            </h2>
            <div className="flex items-center justify-center gap-3 px-4 sm:px-6 py-3 bg-black/50 rounded-lg border border-gray-800 font-mono text-xs sm:text-sm text-white w-full max-w-xs sm:max-w-sm">
              <FileIcon size={16} className="text-gray-400 shrink-0" />
              <span className="truncate text-gray-300 flex-1 text-left">{file?.name}</span>
              <span className="text-gray-500 shrink-0">{(file?.size ? (file.size / 1024 / 1024).toFixed(2) : "0.00")} MB</span>
            </div>
            <p className="mt-4 sm:mt-6 text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest">
              AES-GCM 256-bit
            </p>
          </div>
        )}

        {uploadState === "SUCCESS" && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <CheckCircle2 size={64} className="text-neon-green mb-4 sm:mb-6 glow-green sm:w-20 sm:h-20" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 tracking-wide text-white">Vault Secured</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-6 max-w-sm">
              Your file is encrypted and stored. Share this link. Once the key is lost, the file is irrecoverable.
            </p>

            <div className="flex items-center w-full bg-black/60 border border-neon-green/30 rounded-lg p-2 mb-6 transition-all focus-within:border-neon-green/60 focus-within:glow-green">
              <input 
                type="text" 
                readOnly 
                value={shareLink} 
                className="bg-transparent w-full outline-none text-neon-green font-mono text-[10px] sm:text-xs md:text-sm px-3"
              />
              <button 
                onClick={copyToClipboard}
                className="bg-neon-green/20 hover:bg-neon-green/40 text-neon-green p-2 sm:px-4 sm:py-2 rounded transition-colors flex items-center justify-center gap-2 font-bold cursor-pointer shrink-0"
              >
                <Copy size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <button 
              onClick={reset}
              className="text-xs sm:text-sm text-gray-400 hover:text-white uppercase tracking-widest transition-colors font-mono underline decoration-gray-600 hover:decoration-white underline-offset-4 cursor-pointer"
            >
              Encrypt Another File
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
