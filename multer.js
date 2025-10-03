// il local storage

// SIMONE DANTE 

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Per creare la cartella se non esiste

const app = express();

// Crea la cartella 'public/imgs' se non esiste
const uploadDir = 'public/imgs';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configura lo storage per i file caricati
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Ora salva in public/imgs/
  },
  filename: function (req, file, cb) {
    // Genera un nome univoco per il file (evita sovrascritture)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Crea l'istanza di Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: function (req, file, cb) {
    // Opzionale: accetta solo immagini (MIME types)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo file immagine consentiti!'), false);
    }
  }
});

app.use(express.static('public')); // Serve file statici da 'public' (incluso /imgs)