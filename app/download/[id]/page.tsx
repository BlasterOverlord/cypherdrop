"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DownloadCloud, ShieldCheck, AlertTriangle, Lock, File as FileIcon, Loader2, Shield, Clock } from "lucide-react";
import { importKey, decryptFile, calculateFileHash } from "@/utils/crypto";

type DownloadState = "LOADING_META" | "READY" | "DECRYPTING" | "VERIFIED" | "ERROR";

export default function DownloadPage() {
  const params = useParams();
  const fileId = params?.id as string;

  const [downloadState, setDownloadState] = useState<DownloadState>("LOADING_META");
  const [metadata, setMetadata] = useState<{ filename: string; fileHash: string; fileSize?: number; expiresAt: string } | null>(null);
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
        throw new Error("Decryption key missing from URL. Cannot decrypt.");
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

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Decryption failed. The key might be invalid.");
      setDownloadState("ERROR");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-cyber-dark">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-neon-blue/10 sm:bg-neon-blue/5 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none"></div>

      <header className="mb-8 sm:mb-12 flex flex-col items-center text-center z-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <Shield size={32} className="text-neon-purple sm:w-10 sm:h-10" />
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-white">
            Cypher<span className="text-neon-blue text-glow-blue">Drop</span>
          </h1>
        </div>
        <p className="text-gray-400 font-mono text-xs sm:text-sm max-w-sm sm:max-w-md tracking-wider px-4">
          Secure File Retrieval. Zero server-side visibility.
        </p>
      </header>

      <section className="w-full max-w-lg sm:max-w-xl bg-cyber-gray/90 backdrop-blur-md border border-gray-800 rounded-2xl p-6 sm:p-8 z-10 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none"></div>

        {downloadState === "LOADING_META" && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <Loader2 size={48} className="animate-spin text-neon-blue mb-4 sm:mb-6 sm:w-14 sm:h-14" />
            <p className="font-mono text-gray-400 uppercase tracking-widest text-xs sm:text-sm">Scanning coordinates...</p>
          </div>
        )}

        {downloadState === "READY" && metadata && (
          <div className="flex flex-col items-center text-center w-full">
            <div className="relative mb-6">
              <Lock size={64} className="text-neon-purple sm:w-20 sm:h-20 glow-purple rounded-full p-4 bg-neon-purple/10 border border-neon-purple/30 z-10 relative" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 tracking-wide text-white font-mono uppercase">
              Encrypted File Found
            </h2>
            
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 bg-black/50 px-4 sm:px-6 py-3 border border-gray-700 rounded-lg w-full max-w-md sm:max-w-full">
              <FileIcon size={20} className="text-gray-400 shrink-0" />
              <span className="text-gray-300 font-mono text-[10px] sm:text-sm truncate flex-1 text-left">
                {metadata.filename}
              </span>
              {metadata.fileSize && (
                <span className="text-gray-500 font-mono text-[10px] sm:text-xs">
                  {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
            
            <button
              onClick={handleDecryptAndDownload}
              className="w-full py-4 sm:py-5 rounded-lg bg-neon-blue text-black font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_#0ff0fc] hover:shadow-[0_0_30px_#fff] flex items-center justify-center gap-3 cursor-pointer mb-6"
            >
              <DownloadCloud size={24} className="sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Decrypt &amp; Download</span>
            </button>

            <div className="flex flex-col text-xs sm:text-sm gap-2">
              <p className="text-gray-400 font-mono">
                Requires valid client-side key in URL hash.
              </p>
            </div>
          </div>
        )}

        {downloadState === "DECRYPTING" && (
          <div className="flex flex-col items-center justify-center py-10 sm:py-12 px-4 text-center">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[6px] sm:border-8 border-t-transparent border-neon-blue animate-spin glow-blue mb-6 sm:mb-8 border-r-neon-blue/30 border-b-neon-blue/10"></div>
            <h2 className="text-lg sm:text-2xl font-bold text-neon-blue text-glow-blue font-mono uppercase tracking-widest animate-pulse max-w-full">
              Decrypting Locally
            </h2>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-4 sm:mt-6 uppercase tracking-widest font-mono">
              Running SHA-256 Checksum Matrix
            </p>
          </div>
        )}

        {downloadState === "VERIFIED" && metadata && (
          <div className="flex flex-col items-center text-center py-6 sm:py-8 w-full">
            <ShieldCheck size={80} className="text-neon-green mb-6 glow-green sm:w-24 sm:h-24" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 tracking-wide text-white uppercase font-mono">Integrity Verified</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8 max-w-sm sm:max-w-md px-2">
              The file hash matches exactly with the server&apos;s immutable records. Decryption was fully successful.
            </p>
            
            <div className="text-neon-green font-mono text-[10px] sm:text-xs p-4 sm:p-5 border border-neon-green/30 bg-neon-green/10 rounded-lg w-full mb-8 sm:mb-10 text-left overflow-x-auto shadow-inner">
              <span className="text-white block mb-2 sm:mb-3 opacity-50 uppercase tracking-widest text-[8px] sm:text-[10px]">SHA-256 Match Fingerprint:</span>
              <span className="break-all block">{metadata.fileHash}</span>
            </div>

            {decryptedFileUrl && (
              <a 
                href={decryptedFileUrl} 
                download={metadata.filename}
                className="text-xs sm:text-sm text-neon-blue hover:text-white uppercase tracking-widest font-mono underline decoration-neon-blue/50 underline-offset-8 transition-colors flex items-center gap-2 py-2 px-6 rounded-full hover:bg-white/5 active:bg-white/10"
              >
                <DownloadCloud size={16} /> Force Re-download
              </a>
            )}
          </div>
        )}

        {downloadState === "ERROR" && (
          <div className="flex flex-col items-center text-center py-10 sm:py-12 px-2 w-full">
            <AlertTriangle size={64} className="text-red-500 mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] sm:w-20 sm:h-20" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-wide text-white font-mono uppercase">Access Denied</h2>
            
            <div className="w-full bg-red-500/10 p-4 sm:p-6 border border-red-500/30 rounded-lg mb-6 sm:mb-8 text-left">
              <p className="text-red-400 text-xs sm:text-sm font-mono leading-relaxed break-words break-all">
                <span className="text-red-500 font-bold block mb-1">SYSTEM_FAULT:</span> 
                {errorMessage}
              </p>
            </div>
            
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-mono text-center flex items-center justify-center gap-2">
              <Clock size={12} className="shrink-0" />
              May be expired (over 24h), invalid, or tampered.
            </p>
          </div>
        )}

      </section>
    </main>
  );
}
