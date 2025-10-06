const express = require("express");
const router = express.Router();

const productsController = require("../controller/productsController");

// Rotte CRUD per i prodotti

// GET /products - Elenco di tutti i prodotti
router.get("/", productsController.index);

// GET /products/:id - Ottieni un prodotto specifico
router.get("/:param", productsController.show);

// POST /products - Crea un nuovo prodotto
router.post("/", productsController.store);

// DELETE /products/:id - Elimina un prodotto
router.delete("/:id", productsController.destroy);

module.exports = router;
