require("dotenv").config();
const express = require("express");
const app = express();

// Middleware per il parsing JSON (va messo prima delle rotte)
const cors = require('cors')
const path = require('path')
const portEnv = process.env.PORT;
const connection = require("./data/db");
const errorsHandler = require("./middleware/errorsHandler.js");
const notFound = require("./middleware/notFound.js");
const upload = require("./multer.js");
const imagePath = require('./middleware/imagePathMiddleware.js')
app.use(cors({ origin: process.env.FE_APP }))
app.use('/imgs', express.static(path.join(__dirname, 'public/imgs')))
app.use(express.json());
app.use(imagePath)
// Importa la route dei prodotti
const productsRouting = require("./router/productsRouting");

// Rotta principale
app.get("/", (req, res) => {
  res.send("Hello world");
});

// Usa la route dei prodotti
app.use("/products", productsRouting);

// Avvio del server

app.use(errorsHandler);
app.use(notFound);

app.listen(portEnv, () => {
  console.log(`Server in ascolto su http://localhost:${portEnv}`);
});

// multer
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Nessun file caricato.");
  }

  // L'URL dell'immagine sarà accessibile come /imgs/nomefile.jpg
  const imageUrl = `/imgs/${req.file.filename}`;
  res.send(`File caricato con successo! URL: ${imageUrl}`);
});
