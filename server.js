const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors()); 
app.use(express.json());

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'js.html'));
});

// === SYSTEM MEMORY ===
let vaultFiles = [];
let vaultFolders = ['General']; // Default starting folder

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});

const upload = multer({ storage: storage });

// --- FOLDER ENDPOINTS ---
app.get('/folders', (req, res) => res.json(vaultFolders));

app.post('/folders', (req, res) => {
    const newFolder = req.body.folderName;
    if (newFolder && !vaultFolders.includes(newFolder)) {
        vaultFolders.push(newFolder);
        res.json({ success: true, folders: vaultFolders });
    } else {
        res.status(400).json({ error: 'Invalid or duplicate folder name.' });
    }
});

// --- UPLOAD ENDPOINT ---
app.post('/upload', upload.fields([{ name: 'bookFile', maxCount: 1 }, { name: 'previewFile', maxCount: 1 }]), (req, res) => {
    if (!req.files || !req.files['bookFile']) {
        return res.status(400).json({ error: 'Main file is required.' });
    }

    const mainFile = req.files['bookFile'][0];
    let previewUrl = null;

    if (req.files['previewFile']) {
        previewUrl = `/uploads/${req.files['previewFile'][0].filename}`;
    } else if (mainFile.mimetype.includes('image')) {
        previewUrl = `/uploads/${mainFile.filename}`;
    }

    const newAsset = {
        id: Date.now(),
        title: req.body.title,
        desc: req.body.desc,
        folder: req.body.folder || 'General', 
        fileName: mainFile.originalname,
        fileUrl: `/uploads/${mainFile.filename}`, 
        fileType: mainFile.mimetype,
        previewImage: previewUrl
    };

    vaultFiles.push(newAsset);
    res.json({ success: true, asset: newAsset });
});

// --- FILE DATA ENDPOINTS ---
app.get('/files', (req, res) => res.json(vaultFiles));

app.delete('/delete/:id', (req, res) => {
    const fileId = parseInt(req.params.id);
    const fileIndex = vaultFiles.findIndex(f => f.id === fileId);

    if (fileIndex !== -1) {
        vaultFiles.splice(fileIndex, 1);
        res.json({ success: true, message: 'File deleted successfully!' });
    } else {
        res.status(404).json({ error: 'File not found.' });
    }
});

app.put('/edit/:id', (req, res) => {
    const fileId = parseInt(req.params.id);
    const fileIndex = vaultFiles.findIndex(f => f.id === fileId);

    if (fileIndex !== -1) {
        if (req.body.title) vaultFiles[fileIndex].title = req.body.title;
        if (req.body.desc) vaultFiles[fileIndex].desc = req.body.desc;
        res.json({ success: true, asset: vaultFiles[fileIndex] });
    } else {
        res.status(404).json({ error: 'File not found.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n======================================`);
    console.log(`✅ BACKEND ENGINE IS AWAKE!`);
    console.log(`✅ Listening for your website on Port ${PORT}...`);
    console.log(`======================================\n`);
});
