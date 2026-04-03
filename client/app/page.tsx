"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import { Lock, File as FileIcon, CheckCircle2, Shield, UploadCloud, Copy } from "lucide-react";

type UploadState = "IDLE" | "ENCRYPTING" | "UPLOADING" | "SUCCESS";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("IDLE");
  const [shareLink, setShareLink] = useState<string>("");

  const handleFileDrop = async (droppedFile: File) => {
    setFile(droppedFile);
    // Simulate the flow for now. We will implement real crypto in the next phase.
    setUploadState("ENCRYPTING");
    
    // Fake encryption delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setUploadState("UPLOADING");

    // Fake upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fake a URL (Wait for next phase to get real crypto keys and IDs)
    const fakeId = "a1b2c3d4";
    const fakeKey = "z9y8x7w6v5u4";
    const url = `${window.location.origin}/download/${fakeId}#${fakeKey}`;
    setShareLink(url);
    setUploadState("SUCCESS");
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/5 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="mb-12 flex flex-col items-center text-center z-10">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={40} className="text-neon-purple" />
          <h1 className="text-5xl font-black tracking-tighter uppercase text-white">
            Cypher<span className="text-neon-blue text-glow-blue">Drop</span>
          </h1>
        </div>
        <p className="text-gray-400 font-mono text-sm max-w-md tracking-wider">
          End-to-End Encrypted File Transfer. The server never sees your keys.
        </p>
      </header>

      <section className="w-full max-w-2xl bg-cyber-gray border border-gray-800 rounded-2xl p-8 z-10 shadow-2xl">
        {uploadState === "IDLE" && (
          <DropZone onFileDrop={handleFileDrop} />
        )}

        {(uploadState === "ENCRYPTING" || uploadState === "UPLOADING") && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-8 text-white">
              {/* Spinner */}
              <div className={`w-24 h-24 rounded-full border-4 border-t-transparent animate-spin ${uploadState === "ENCRYPTING" ? "border-neon-purple glow-purple" : "border-neon-blue glow-blue"}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {uploadState === "ENCRYPTING" ? (
                  <Lock size={32} className="text-neon-purple" />
                ) : (
                  <UploadCloud size={32} className="text-neon-blue" />
                )}
              </div>
            </div>
            
            <h2 className={`text-2xl font-bold mb-4 font-mono uppercase tracking-widest ${uploadState === "ENCRYPTING" ? "text-glow-purple text-neon-purple" : "text-glow-blue text-neon-blue"}`}>
              {uploadState === "ENCRYPTING" ? "Encrypting Locally..." : "Uploading Payload..."}
            </h2>
            <div className="flex items-center justify-center gap-3 px-6 py-3 bg-black/50 rounded-lg border border-gray-800 font-mono text-sm text-white">
              <FileIcon size={16} className="text-gray-400" />
              <span className="truncate max-w-[200px] text-gray-300">{file?.name}</span>
              <span className="text-gray-500">{(file?.size ? (file.size / 1024 / 1024).toFixed(2) : "0.00")} MB</span>
            </div>
            <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest">
              AES-GCM 256-bit
            </p>
          </div>
        )}

        {uploadState === "SUCCESS" && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 size={72} className="text-neon-green mb-6 glow-green" />
            <h2 className="text-3xl font-bold mb-3 tracking-wide text-white">Vault Secured</h2>
            <p className="text-gray-400 mb-8 max-w-sm">
              Your file is encrypted and stored. Share this link. Once the key is lost, the file is irrecoverable.
            </p>

            <div className="flex items-center w-full max-w-lg bg-black/60 border border-neon-green/30 rounded-lg p-2 mb-8">
              <input 
                type="text" 
                readOnly 
                value={shareLink} 
                className="bg-transparent w-full outline-none text-neon-green font-mono text-sm px-3"
              />
              <button 
                onClick={copyToClipboard}
                className="bg-neon-green/20 hover:bg-neon-green/40 text-neon-green p-2 rounded transition-colors flex items-center gap-2 font-bold cursor-pointer"
              >
                <Copy size={18} />
              </button>
            </div>

            <button 
              onClick={reset}
              className="text-sm text-gray-400 hover:text-white uppercase tracking-widest transition-colors font-mono underline decoration-gray-600 hover:decoration-white underline-offset-4 cursor-pointer"
            >
              Encrypt Another File
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
