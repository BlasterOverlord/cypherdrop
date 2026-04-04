import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/mongoose";
import FileModel from "@/lib/models/File";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileHash = formData.get("fileHash") as string;

    if (!file || !fileHash) {
      return NextResponse.json({ error: "Missing file or hash" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate ID
    const fileId = Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Ensure uploads directory exists securely outside public folder
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name}`;
    const encryptedBlobPath = path.join(uploadDir, filename);

    // Save to disk
    fs.writeFileSync(encryptedBlobPath, buffer);

    // Save metadata
    await FileModel.create({
      fileId,
      filename: file.name,
      fileSize: buffer.length,
      encryptedBlobPath,
      fileHash,
      expiresAt,
    });

    return NextResponse.json({ message: "File successfully encrypted and stored!", fileId }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Server error processing upload" }, { status: 500 });
  }
}
