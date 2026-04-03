"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DownloadCloud, ShieldCheck, AlertTriangle, Lock, File as FileIcon, Loader2 } from "lucide-react";
import { importKey, decryptFile, calculateFileHash } from "@/utils/crypto";

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
        const response = await fetch(`http://localhost:5000/api/metadata/${fileId}`);
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
      // 1. Get the Key from the URL Hash Fragment (Security Core Concept)
      const hashFragment = window.location.hash.substring(1);
      if (!hashFragment) {
        throw new Error("Decryption key missing from URL.");
      }

      const cryptoKey = await importKey(hashFragment);

      // 2. Fetch the encrypted binary payload from the server
      const blobResponse = await fetch(`http://localhost:5000/api/download/${fileId}`);
      if (!blobResponse.ok) {
        throw new Error("Failed to fetch the encrypted file from the server.");
      }

      const encryptedArrayBuffer = await blobResponse.arrayBuffer();

      // 3. Decrypt the payload
      const decryptedBuffer = await decryptFile(encryptedArrayBuffer, cryptoKey);

      // 4. Verify Integrity (SHA-256)
      const decryptedHash = await calculateFileHash(decryptedBuffer);
      if (decryptedHash !== metadata?.fileHash) {
        throw new Error("CRITICAL: Integrity check failed. The file has been tampered with or corrupted.");
      }

      // 5. Create a secure local object URL to trigger the download
      const finalBlob = new Blob([decryptedBuffer], { type: "application/octet-stream" });
      const fileUrl = URL.createObjectURL(finalBlob);
      
      setDecryptedFileUrl(fileUrl);
      setDownloadState("VERIFIED");

      // Auto-trigger download
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-cyber-dark">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="mb-12 flex flex-col items-center text-center z-10">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck size={40} className="text-neon-blue text-glow-blue" />
          <h1 className="text-5xl font-black tracking-tighter uppercase text-white">
            Secure<span className="text-neon-blue text-glow-blue">Retrieve</span>
          </h1>
        </div>
        <p className="text-gray-400 font-mono text-sm max-w-md tracking-wider">
          Decrypting payload locally. Zero server-side visibility.
        </p>
      </header>

      <section className="w-full max-w-lg bg-cyber-gray border border-gray-800 rounded-2xl p-8 z-10 shadow-2xl relative">
        
        {downloadState === "LOADING_META" && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 size={48} className="animate-spin text-neon-blue mb-4" />
            <p className="font-mono text-gray-400 uppercase tracking-widest text-sm">Locating coordinates...</p>
          </div>
        )}

        {downloadState === "READY" && metadata && (
          <div className="flex flex-col items-center text-center">
            <Lock size={64} className="text-neon-purple mb-6 glow-purple rounded-full p-2 bg-neon-purple/10" />
            <h2 className="text-2xl font-bold mb-2 tracking-wide text-white">Encrypted Payload Found</h2>
            <div className="flex items-center gap-2 mb-8 bg-black/50 px-4 py-2 border border-gray-700 rounded-lg">
              <FileIcon size={16} className="text-gray-400" />
              <span className="text-gray-300 font-mono text-sm truncate max-w-[250px]">{metadata.filename}</span>
            </div>
            
            <button
              onClick={handleDecryptAndDownload}
              className="w-full py-4 rounded-lg bg-neon-blue text-black font-bold uppercase tracking-widest hover:bg-white transition-all glow-blue flex items-center justify-center gap-3"
            >
              <DownloadCloud size={20} />
              Decrypt &amp; Download
            </button>
            <p className="mt-6 text-xs text-gray-500 font-mono text-center">
              Requires valid key in URL hash.
            </p>
          </div>
        )}

        {downloadState === "DECRYPTING" && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-24 h-24 rounded-full border-4 border-t-transparent border-neon-blue animate-spin glow-blue mb-6"></div>
            <h2 className="text-xl font-bold text-neon-blue text-glow-blue font-mono uppercase tracking-widest animate-pulse">
              Decrypting &amp; Verifying...
            </h2>
            <p className="text-gray-400 text-xs mt-4 uppercase tracking-widest">Running SHA-256 Checksum</p>
          </div>
        )}

        {downloadState === "VERIFIED" && metadata && (
          <div className="flex flex-col items-center text-center py-6">
            <ShieldCheck size={80} className="text-neon-green mb-6 glow-green" />
            <h2 className="text-3xl font-bold mb-2 tracking-wide text-white">Integrity Verified</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              The file hash matches the server's records exactly. Decryption successful.
            </p>
            
            <div className="text-neon-green font-mono text-xs p-3 border border-neon-green/30 bg-neon-green/10 rounded-lg w-full mb-6 break-all overflow-hidden text-left">
              <span className="text-white block mb-1">SHA-256 Match:</span>
              {metadata.fileHash}
            </div>

            {decryptedFileUrl && (
              <a 
                href={decryptedFileUrl} 
                download={metadata.filename}
                className="text-sm text-neon-blue hover:text-white uppercase tracking-widest font-mono underline decoration-neon-blue/50 underline-offset-4"
              >
                Download Again
              </a>
            )}
          </div>
        )}

        {downloadState === "ERROR" && (
          <div className="flex flex-col items-center text-center py-10">
            <AlertTriangle size={64} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            <h2 className="text-2xl font-bold mb-4 tracking-wide text-white">Access Denied</h2>
            <p className="text-red-400 text-sm max-w-xs font-mono bg-red-500/10 p-4 border border-red-500/30 rounded-lg">
              {errorMessage}
            </p>
            <p className="mt-8 text-xs text-gray-500 uppercase tracking-widest font-mono text-center">
              The link is invalid, expired, or tampered with.
            </p>
          </div>
        )}

      </section>
    </main>
  );
}
