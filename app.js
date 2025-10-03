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
