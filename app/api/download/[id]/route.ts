import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dbConnect from "@/lib/mongoose";
import FileModel from "@/lib/models/File";
import { r2 } from "@/lib/r2";

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "cypherdrop-vault";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const file = await FileModel.findOne({ fileId: id });
    if (!file) {
      return NextResponse.json({ error: "File not found or has expired." }, { status: 404 });
    }

    // Prepare a pre-signed url for getting the object
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.s3Key,
    });

    const presignedDownloadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    // Transparently redirect the client fetch request to the R2 url.
    // The browser fetch logic (await blobResponse.arrayBuffer()) will automatically follow this redirect.
    return NextResponse.redirect(presignedDownloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Server error downloading file." }, { status: 500 });
  }
}
