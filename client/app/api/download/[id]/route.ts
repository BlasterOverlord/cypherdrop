import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
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

    if (!fs.existsSync(file.encryptedBlobPath)) {
      return NextResponse.json({ error: "The encrypted blob is missing from the server." }, { status: 404 });
    }

    const { size } = fs.statSync(file.encryptedBlobPath);
    const fileBuffer = fs.readFileSync(file.encryptedBlobPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Content-Type": "application/octet-stream",
        "Content-Length": size.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Server error downloading file." }, { status: 500 });
  }
}