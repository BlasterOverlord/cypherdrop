import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model("File", fileSchema);
