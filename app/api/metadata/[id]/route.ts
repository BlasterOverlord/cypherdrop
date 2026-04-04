import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import FileModel from "@/lib/models/File";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const file = await FileModel.findOne({ fileId: id });
    if (!file) {
      return NextResponse.json({ error: "File not found or has expired." }, { status: 404 });
    }

    return NextResponse.json({
      filename: file.filename,
      fileSize: file.fileSize || 0,
      fileHash: file.fileHash,
      expiresAt: file.expiresAt,
    });
  } catch (error) {
    console.error("Metadata error:", error);
    return NextResponse.json({ error: "Server error retrieving metadata." }, { status: 500 });
  }
}