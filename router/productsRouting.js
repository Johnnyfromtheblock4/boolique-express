const express = require("express");
const router = express.Router();
const productsController = require("../controller/productsController");
const upload = require("../multer.js"); // se vuoi gestire upload file per store/update

// ROTTE CRUD PRODOTTI

// GET /products - Elenco di tutti i prodotti
router.get("/", productsController.index);

// GET /products/:param - Ottieni un prodotto specifico (id o slug)
router.get("/:param", productsController.show);

// POST /products - Crea un nuovo prodotto
router.post("/", upload.array("image_url", 10), productsController.store);

// PUT /products/:id - Aggiorna un prodotto completamente
router.put("/:id", upload.array("image_url", 10), productsController.update);

// PATCH /products/:id - Aggiorna solo i campi forniti
router.patch("/:id", upload.array("image_url", 10), productsController.patch);
// DELETE /products/:id - Elimina un prodotto
router.delete("/:id", productsController.destroy);

module.exports = router;
