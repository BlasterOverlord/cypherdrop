"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DownloadCloud, ShieldCheck, AlertTriangle, Lock, File as FileIcon, Loader2 } from "lucide-react";
import { importKey, decryptFile, calculateFileHash } from "@/utils/crypto";
import { motion, AnimatePresence } from "framer-motion";

type DownloadState = "LOADING_META" | "READY" | "DECRYPTING" | "VERIFIED" | "ERROR";

export default function DownloadPage() {
  const params = useParams();
  const fileId = params?.id as string;

  const [downloadState, setDownloadState] = useState<DownloadState>("LOADING_META");
  const [metadata, setMetadata] = useState<{ filename: string; fileHash: string; expiresAt: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;

    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/metadata/${fileId}`);
        const data = await response.json();

        if (response.ok) {
          setMetadata(data);
          setDownloadState("READY");
        } else {
          setErrorMessage(data.error || "File not found or expired.");
          setDownloadState("ERROR");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Could not connect to the server.");
        setDownloadState("ERROR");
      }
    };

    fetchMetadata();
  }, [fileId]);

  const handleDecryptAndDownload = async () => {
    setDownloadState("DECRYPTING");
    setErrorMessage("");

    try {
      const hashFragment = window.location.hash.substring(1);
      if (!hashFragment) {
        throw new Error("Decryption key missing from URL.");
      }

      const cryptoKey = await importKey(hashFragment);

      const blobResponse = await fetch(`/api/download/${fileId}`);
      if (!blobResponse.ok) {
        throw new Error("Failed to fetch the encrypted file from the server.");
      }

      const encryptedArrayBuffer = await blobResponse.arrayBuffer();
      const decryptedBuffer = await decryptFile(encryptedArrayBuffer, cryptoKey);
      const decryptedHash = await calculateFileHash(decryptedBuffer);
      
      if (decryptedHash !== metadata?.fileHash) {
        throw new Error("CRITICAL: Integrity check failed. The file has been tampered with or corrupted.");
      }

      const finalBlob = new Blob([decryptedBuffer], { type: "application/octet-stream" });
      const fileUrl = URL.createObjectURL(finalBlob);
      
      setDecryptedFileUrl(fileUrl);
      setDownloadState("VERIFIED");

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = metadata?.filename || "decrypted-file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setErrorMessage(err.message || "Decryption failed. The key might be invalid.");
      } else {
        setErrorMessage("Decryption failed. The key might be invalid.");
      }
      setDownloadState("ERROR");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-6 relative overflow-hidden bg-[#05050A]">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: "linear-gradient(#0ff0fc 1px, transparent 1px), linear-gradient(90deg, #0ff0fc 1px, transparent 1px)", backgroundSize: "3rem 3rem" }}>
      </div>

      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-neon-blue/10 blur-[120px] rounded-full pointer-events-none" 
      />

      <header className="mb-8 sm:mb-12 flex flex-col items-center text-center z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 sm:gap-4 mb-4"
        >
          <ShieldCheck size={36} className="text-neon-blue text-glow-blue sm:w-10 sm:h-10" />
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-white">
            Secure<span className="text-neon-blue text-glow-blue">Retrieve</span>
          </h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="text-gray-400 font-mono text-xs sm:text-sm max-w-xs sm:max-w-md tracking-wider leading-relaxed px-4"
        >
          Decrypting payload locally. Zero server-side visibility.
        </motion.p>
      </header>

      <section className="w-full max-w-md sm:max-w-lg bg-[#0B0D14]/80 backdrop-blur-xl border border-gray-800/80 rounded-[2rem] p-6 sm:p-10 z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          {downloadState === "LOADING_META" && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 size={48} className="animate-spin text-neon-blue mb-6 drop-shadow-[0_0_10px_rgba(15,240,252,0.8)]" />
              <p className="font-mono text-neon-blue/70 uppercase tracking-[0.2em] text-xs sm:text-sm animate-pulse">Locating coordinates...</p>
            </motion.div>
          )}

          {downloadState === "READY" && metadata && (
            <motion.div 
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center text-center"
            >
              <div className="bg-neon-purple/10 p-4 rounded-full mb-6 border border-neon-purple/20 glow-purple">
                <Lock size={48} className="text-neon-purple sm:w-16 sm:h-16 text-glow-purple" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 tracking-wider text-white">Encrypted Payload Found</h2>
              
              <div className="flex items-center gap-3 w-full max-w-[90%] mb-10 bg-black/60 px-4 py-3 border border-gray-800 rounded-xl">
                <FileIcon size={20} className="text-gray-400 shrink-0" />
                <span className="text-gray-300 font-mono text-sm truncate shrink">{metadata.filename}</span>
              </div>
              
              <button
                onClick={handleDecryptAndDownload}
                className="w-full py-4 rounded-xl bg-neon-blue hover:bg-white text-black font-black uppercase tracking-widest transition-all duration-300 glow-blue hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] flex items-center justify-center gap-3 active:scale-95"
              >
                <DownloadCloud size={22} />
                Decrypt &amp; Download
              </button>
              <p className="mt-6 text-[10px] sm:text-xs text-gray-500 font-mono text-center px-4">
                Requires valid decryption key in URL hash fragment.
              </p>
            </motion.div>
          )}

          {downloadState === "DECRYPTING" && (
            <motion.div 
              key="decrypting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-2 border-t-neon-blue border-r-neon-blue border-b-transparent border-l-transparent" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-2 rounded-full border-2 border-t-neon-purple border-l-neon-purple border-b-transparent border-r-transparent opacity-70" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck size={32} className="text-neon-blue text-glow-blue" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-neon-blue text-glow-blue font-mono uppercase tracking-[0.15em] animate-pulse text-center">
                Decrypting Data...
              </h2>
              <p className="text-gray-400 text-[10px] sm:text-xs mt-4 uppercase tracking-[0.2em]">Running SHA-256 Checksum</p>
            </motion.div>
          )}

          {downloadState === "VERIFIED" && metadata && (
            <motion.div 
              key="verified"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center py-6"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}
                          className="bg-neon-green/10 p-5 rounded-full mb-6 border border-neon-green/20 glow-green">
                <ShieldCheck size={56} className="text-neon-green sm:w-20 sm:h-20" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-wide text-white">Integrity Verified</h2>
              <p className="text-gray-400 text-xs sm:text-sm mb-8 max-w-xs leading-relaxed">
                The file hash matches the server&apos;s records. Payload decrypted successfully.
              </p>
              
              <div className="text-neon-green font-mono text-[10px] sm:text-xs p-4 border border-neon-green/30 bg-neon-green/5 rounded-xl w-full mb-8 break-all overflow-hidden text-left shadow-[inset_0_0_20px_rgba(57,255,20,0.05)]">
                <span className="text-white block mb-2 tracking-wider">SHA-256 CHECKSUM MATCH:</span>
                <span className="opacity-80">{metadata.fileHash}</span>
              </div>

              {decryptedFileUrl && (
                <a 
                  href={decryptedFileUrl} 
                  download={metadata.filename}
                  className="group flex items-center gap-2 text-xs sm:text-sm text-neon-blue hover:text-white uppercase tracking-[0.15em] font-mono py-2 px-6 rounded-lg transition-colors hover:bg-neon-blue/10 border border-transparent hover:border-neon-blue/30"
                >
                  <DownloadCloud size={16} className="group-hover:scale-110 transition-transform" />
                  Download Again
                </a>
              )}
            </motion.div>
          )}

          {downloadState === "ERROR" && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-8"
            >
              <div className="bg-red-500/10 p-4 mx-auto rounded-full mb-6 border border-red-500/30">
                <AlertTriangle size={56} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
              </div>
              <h2 className="text-2xl font-bold mb-4 tracking-wide text-white uppercase text-glow-red">Access Denied</h2>
              <div className="w-full bg-black/40 p-4 sm:p-5 border border-red-500/30 rounded-xl shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
                <p className="text-red-400 text-xs sm:text-sm font-mono break-words">
                  {errorMessage}
                </p>
              </div>
              <p className="mt-8 text-[10px] sm:text-xs text-gray-500 uppercase tracking-[0.15em] font-mono text-center">
                The link is invalid, expired, or tampered with.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </section>
    </main>
  );
}
