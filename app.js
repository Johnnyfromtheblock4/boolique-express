const express = require("express");
const app = express();
const port = 3000;

const productRouter = require("./router/productsRouting");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
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