const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: { 
    type: String, 
    required: true, 
    unique: true 
  }, // The unique sharing code
  filename: { 
    type: String, 
    required: true 
  }, // Original filename (also encrypted in practice, but keeping it simple as metadata for now)
  encryptedBlobPath: { 
    type: String, 
    required: true 
  }, // Path to the file on disk
  fileHash: { 
    type: String, 
    required: true 
  }, // SHA-256 hash of original file for integrity
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expires: 0 } // Use MongoDB TTL index to auto-delete document when time passes
  },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
