const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  filename: { 
    type: String, 
    required: true 
  },
  encryptedBlobPath: { 
    type: String, 
    required: true 
  },
  fileHash: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expires: 0 }
  },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
