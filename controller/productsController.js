// CRUD (index, show, post, put, patch, delete) e query e slug

// ROB

const connection = require("../data/db");

const index = (req, res) => {
  const sql = "SELECT * FROM products";

  connection.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ error: "Fallita ricerca dei prodotti" });

    res.send(results);
  });
};

const show = (req, res) => {
  const id = req.params.id;

  const sql = "SELECT * FROM products WHERE ID = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Query fallita" });
    if (results.length === 0)
      return res.status(404).json({ error: "Prodotto non trovato" });
  });
};

const store = (req, res, next) => {
  console.log("Body ricevuto", req.body);
  console.log("File ricevuto", req.file);

  const { name, price, description } = req.body;
  console.log(req.file);

  const filename = `${req.file.filename}`;
  const query =
    "INSERT INTO products (name, price, color, size, description) VALUES (?,?,?,?,?)";

  connection.query(query, [name, price, description], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Errore durante inserimento" + err });
    }
    res.status(201).json({
      result: true,
      message: "prodotto creato con successo!",
    });
  });
};

const destroy = (req, res) => {
  const id = req.params.id;

  connection.query("DELETE FROM products WHERE ID = ?", [id], (err) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Errore nel cancellare il prodotto" });
    res.sendStatus(204);
  });
};

module.exports = {
  index,
  show,
  store,
  destroy,
};
