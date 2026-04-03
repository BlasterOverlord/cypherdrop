/**
 * Utility for Web Crypto API (AES-GCM 256-bit)
 */

// Generate a random AES-GCM 256-bit key
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // Extractable so we can share it
    ["encrypt", "decrypt"]
  );
};

// Convert a buffer to a URL-safe Base64 string (for the URL hash)
export const bufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// Export the generated CryptoKey to a sharable string
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64Url(rawKey);
};

// Convert a URL-safe Base64 string back to a buffer
export const base64UrlToBuffer = (base64Url: string): ArrayBuffer => {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Import a shared string key back into a CryptoKey for decryption
export const importKey = async (base64UrlKey: string): Promise<CryptoKey> => {
  const rawKey = base64UrlToBuffer(base64UrlKey);
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
};

// Calculate SHA-256 hash of a file for integrity verification
export const calculateFileHash = async (fileBuffer: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Encrypt the file. Returns a single ArrayBuffer containing:
// [12 bytes IV] + [encrypted data...]
export const encryptFile = async (
  fileBuffer: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> => {
  // AES-GCM requires a 12-byte initialization vector (nonce)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileBuffer
  );

  // Combine IV and Encrypted File into one contiguous buffer
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0); // First 12 bytes
  combined.set(new Uint8Array(encryptedBuffer), iv.length); // The rest

  return combined.buffer;
};

// Decrypt the file. Expects [12 bytes IV] + [encrypted data...]
export const decryptFile = async (
  combinedBuffer: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> => {
  const data = new Uint8Array(combinedBuffer);
  
  // Extract the first 12 bytes as the IV
  const iv = data.slice(0, 12);
  // Extract the rest as the actual encrypted payload
  const encryptedFile = data.slice(12);

  // This will throw an error if the key is wrong or data was tampered with (Auth Tag mismatch)
  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedFile.buffer
  );
};
