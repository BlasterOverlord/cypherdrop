const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const generateId = require('../utils/generateId');

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Save the file with a timestamp to prevent overwriting
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Configure multer: 50MB file size limit
const upload = multer({ 
    storage, 
    limits: { fileSize: 50 * 1024 * 1024 } 
});

// POST /api/upload - Receives the encrypted blob
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // The SHA-256 hash will be passed from the client side FormData
        const { fileHash } = req.body;
        if (!fileHash) {
            // Cleanup the saved file if validation fails
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'File hash is required for integrity' });
        }

        const fileId = generateId();
        // File expires in 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

        const newFile = new File({
            fileId,
            filename: req.file.originalname,
            encryptedBlobPath: req.file.path,
            fileHash,
            expiresAt
        });

        await newFile.save();
        res.status(201).json({ 
            message: 'File successfully encrypted and stored!', 
            fileId 
        });
    } catch (err) {
        console.error('Upload Error:', err);
        // Clean up the uploaded file if DB save fails
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Server error processing upload.' });
    }
});

// GET /api/metadata/:id - Gets file data without the blob itself
router.get('/metadata/:id', async (req, res) => {
    try {
        const file = await File.findOne({ fileId: req.params.id });
        if (!file) {
            return res.status(404).json({ error: 'File not found or has expired.' });
        }

        res.json({
            filename: file.filename,
            fileHash: file.fileHash,
            expiresAt: file.expiresAt
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving metadata.' });
    }
});

// GET /api/download/:id - Streams the encrypted binary blob to the client
router.get('/download/:id', async (req, res) => {
    try {
        const file = await File.findOne({ fileId: req.params.id });
        if (!file) return res.status(404).json({ error: 'File not found or has expired.' });

        if (fs.existsSync(file.encryptedBlobPath)) {
            // Send the file as an attachment
            res.download(file.encryptedBlobPath, file.filename);
        } else {
            res.status(404).json({ error: 'The encrypted blob is missing from the server.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error downloading file.' });
    }
});

module.exports = router;