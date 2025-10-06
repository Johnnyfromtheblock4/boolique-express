// productsRouting.js

const express = require('express');
const router = express.Router();

const productsController = require('../controllers/productsController');

// Rotte CRUD per i prodotti

// GET /products - Elenco di tutti i prodotti
router.get('/', productsController.getAllProducts);

// GET /products/:id - Ottieni un prodotto specifico
router.get('/:id', productsController.getProductById);

// POST /products - Crea un nuovo prodotto
router.post('/', productsController.createProduct);

// PUT /products/:id - Aggiorna un prodotto esistente
router.put('/:id', productsController.updateProduct);

// DELETE /products/:id - Elimina un prodotto
router.delete('/:id', productsController.deleteProduct);

module.exports = router;