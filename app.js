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
