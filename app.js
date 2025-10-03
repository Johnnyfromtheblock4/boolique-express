require('dotenv').config();
const express = require("express");
const app = express();
const port = process.env.PORT
const connection = require('./data/db')
const productRouter = require("./router/productsRouting");
const errorsHandler = require('./middleware/errorsHandler.js')
const notFound = require('./middleware/notFound.js')
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});
app.use(errorsHandler)
app.use(notFound)
app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
