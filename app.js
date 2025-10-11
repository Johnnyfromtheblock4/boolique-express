require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connection = require("./data/db");
const errorsHandler = require("./middleware/errorsHandler.js");
const notFound = require("./middleware/notFound.js");
const upload = require("./multer.js");
const imagePath = require('./middleware/imagePathMiddleware.js');
const orderRouting = require("./router/orderRouting");

const productsRouting = require("./router/productsRouting");

const app = express();
const portEnv = process.env.PORT || 3000;

// Middleware globali
app.use(cors({ origin: process.env.FE_APP }));
app.use(express.json());
app.use('/imgs', express.static(path.join(__dirname, '/public/imgs')));
app.use(imagePath);

// Rotta principale
app.get("/", (req, res) => {
  res.send("Hello world");
});

// Rotte prodotti
app.use("/products", productsRouting);
app.use("/orders", orderRouting);

// Rotta upload immagini standalone
app.post("/upload", upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nessun file caricato." });
  }

  const uploaded = req.files.map(f => ({
    filename: f.filename,
    path: `/imgs/${f.filename}`,
  }));

  res.status(200).json({
    message: "Immagini caricate con successo!",
    files: uploaded,
  });
});

// Middleware gestione errori e 404
app.use(errorsHandler);
app.use(notFound);

// Avvio server
app.listen(portEnv, () => {
  console.log(`Server in ascolto su http://localhost:${portEnv}`);
});
