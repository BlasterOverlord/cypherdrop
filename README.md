# CypherDrop 🔒

CypherDrop is an open-source, end-to-end encrypted (E2EE) file transfer web application designed with a strict **Zero-Knowledge Architecture**. It allows users to securely share files without ever trusting the server with the contents or the encryption keys.

Built with Next.js App Router, Tailwind CSS, MongoDB, and Cloudflare R2 for scalable, secure object storage.

## ✨ Features

- **True Zero-Knowledge Architecture:** Encryption keys are generated client-side and never leave the browser.
- **Client-Side E2EE:** Files are encrypted using AES-GCM 256-bit cryptography via the native Web Crypto API before the upload ever begins.
- **Direct-to-Cloud Uploads:** Encrypted payloads are uploaded directly from the browser to Cloudflare R2 using AWS S3 presigned URLs, bypassing server-side memory/disk bottlenecks.
- **Immutable Integrity:** Plaintext files are hashed using SHA-256 before encryption. The receiver verifies this exact hash post-decryption.
- **Ephemeral Storage:** Metadata and files are designed to auto-expire (e.g., 24 hours), powered by MongoDB TTL indexes and bucket lifecycles.
- **Cyberpunk UI:** A sleek, dark-themed, highly responsive interface with glowing neon aesthetics and toast notifications.

---

## 🧠 Why is this a "Zero-Knowledge Architecture"?

In a typical file-sharing application, the server receives the raw file, encrypts it on the backend, and stores it. This means the server (and whoever controls it) has the ability to read the file. 

CypherDrop shifts the cryptography entirely to the client:
1. When a user selects a file, the browser generates a cryptographically secure, random 256-bit AES key.
2. The file is encrypted locally in the browser's memory.
3. The encrypted ciphertext is uploaded to Cloudflare R2 directly through presigned url, this means the server does not even get to see the encrypted blob.
4. The locally-generated encryption key is appended to the sharing URL as a hash fragment (e.g., `https://cypherdrop.com/download/abc12345#secretkey...`).

**Crucially, URL hash fragments (`#...`) are never sent to the server in HTTP requests.** 

Consequently, the CypherDrop backend and database/cloud storage only store the ciphertext and non-sensitive metadata (filename, size, plaintext hash). If the database or Cloudflare R2 bucket is fully compromised or subpoenaed, the files remain impossible to decrypt without the specific URL given to the recipient.

---

## 🔐 Cryptography Deep Dive

### AES-GCM 256-bit Encryption
CypherDrop utilizes **AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)** with a 256-bit key length. GCM is an Authenticated Encryption with Associated Data (AEAD) cipher. This means it provides both **confidentiality** (hiding the data) and **authenticity** (detecting if the ciphertext was tampered with).

### Why the extra SHA-256 Hashing?
You might wonder: *If AES-GCM already provides integrity via its authentication tag, why does CypherDrop calculate an extra SHA-256 hash of the file?*

While AES-GCM's auth tag perfectly guarantees that the *ciphertext* hasn't been altered while sitting in Cloudflare R2, it only validates the encryption envelope. CypherDrop takes it a step further by calculating a **SHA-256 hash of the original plaintext file** *before* encryption. This ensures that the file wasn't corrupted before the encryption!

This plaintext hash is stored in the database as public metadata. When the recipient downloads and decrypts the file, their browser locally hashes the final output and compares it against the database's record.

This provides two distinct guarantees:
1. **The Ciphertext Integrity (AES-GCM):** The file wasn't corrupted or maliciously altered at rest.
2. **The Plaintext Fingerprint (SHA-256):** An immutable, verifiable cryptographic proof that the exact, bit-for-bit file the sender intended to send is exactly what the receiver extracted. It serves as an independent checksum separating transport/storage integrity from payload identity.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB cluster (e.g., MongoDB Atlas)
- A Cloudflare R2 Bucket (or any AWS S3-compatible storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BlasterOverlord/cypherdrop.git
   cd CypherDrop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env.local` and fill in your credentials.
   ```env
   # MongoDB Connection
   MONGODB_URI="mongodb+srv://..."

   # Cloudflare R2 / S3 Storage
   R2_ACCESS_KEY_ID="your_access_key"
   R2_SECRET_ACCESS_KEY="your_secret_key"
   R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
   R2_BUCKET_NAME="whatever you name your bucket goes here"
   ```
   *Note: Ensure your R2 Bucket has a CORS policy configured to allow `PUT` and `GET` requests from your frontend origin.*

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16
- **Cryptography:** Web Crypto API (Native browser execution, no external crypto dependencies)
- **Backend API:** Next.js Serverless Route Handlers
- **Database:** MongoDB (via Mongoose)
- **Storage:** Cloudflare R2 (via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`)

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
