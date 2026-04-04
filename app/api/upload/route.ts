import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dbConnect from "@/lib/mongoose";
import FileModel from "@/lib/models/File";
import { r2 } from "@/lib/r2";

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "cypherdrop-vault";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { filename, fileHash, fileSize } = body;

    if (!filename || !fileHash || !fileSize) {
      return NextResponse.json({ error: "Missing metadata (filename, fileHash, fileSize)" }, { status: 400 });
    }

    // Generate ID
    const fileId = Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const s3Key = `${fileId}-${filename}`; // Ensure unique object key

    // Save metadata locally to link the URL with the object in R2
    await FileModel.create({
      fileId,
      filename,
      fileSize,
      s3Key,
      fileHash,
      expiresAt,
    });

    // Create command for PutObject
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: "application/octet-stream",
    });

    // Generate presigned URL valid for upload (1 hour limit)
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.json({ message: "Upload URL generated", presignedUrl, fileId }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Server error setting up upload" }, { status: 500 });
  }
}
