const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// This allows your HTML file to connect to this server securely
app.use(cors()); 
app.use(express.json());

// Create the 'uploads' folder automatically if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Make the uploads folder publicly readable so previews and downloads work
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Temporary memory to store the list of uploaded files
let vaultFiles = [];

// Configure how and where files are saved on your computer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        // Clean up the file name (replaces spaces with underscores)
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});

const upload = multer({ storage: storage });

// The API endpoint that receives the files from your website
app.post('/upload', upload.fields([{ name: 'bookFile', maxCount: 1 }, { name: 'previewFile', maxCount: 1 }]), (req, res) => {
    
    // Check if the main file was actually sent
    if (!req.files || !req.files['bookFile']) {
        return res.status(400).json({ error: 'Main file is required.' });
    }

    const mainFile = req.files['bookFile'][0];
    let previewUrl = null;

    // Check if an optional screenshot was uploaded alongside the main file
    if (req.files['previewFile']) {
        previewUrl = `/uploads/${req.files['previewFile'][0].filename}`;
    } 
    // If no screenshot, but the main file IS an image, use it as its own preview
    else if (mainFile.mimetype.includes('image')) {
        previewUrl = `/uploads/${mainFile.filename}`;
    }

    // Create the database record for this file
    const newAsset = {
        id: Date.now(),
        title: req.body.title,
        desc: req.body.desc,
        fileName: mainFile.originalname,
        fileUrl: `/uploads/${mainFile.filename}`, 
        fileType: mainFile.mimetype,
        previewImage: previewUrl
    };

    vaultFiles.push(newAsset);
    res.json({ success: true, asset: newAsset });
});

// The API endpoint that sends the list of files to your website's catalog
app.get('/files', (req, res) => res.json(vaultFiles));

// Start the engine
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n======================================`);
    console.log(`✅ BACKEND ENGINE IS AWAKE!`);
    console.log(`✅ Listening for your website on Port ${PORT}...`);
    console.log(`======================================\n`);
});