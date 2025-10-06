const express = require("express");
const app = express();
const port = 3000;

// Middleware per il parsing JSON (va messo prima delle rotte)
app.use(express.json());

// Importa la route dei prodotti
const productsRouting = require("./routes/productsRouting");

// Rotta principale
app.get("/", (req, res) => {
  res.send("Hello world");
});

// Usa la route dei prodotti
app.use("/products", productsRouting);

// Avvio del server
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});


// multer
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nessun file caricato.');
  }
  
  // L'URL dell'immagine sarà accessibile come /imgs/nomefile.jpg
  const imageUrl = `/imgs/${req.file.filename}`;
  res.send(`File caricato con successo! URL: ${imageUrl}`);
});