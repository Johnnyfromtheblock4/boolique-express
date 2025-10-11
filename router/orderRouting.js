const express = require("express");
const router = express.Router();
const connection = require("../data/db");

// Salva ordine
router.post("/", (req, res) => {
  const { name, surname, email, address, amount, free_shipping, cartItems } = req.body;

  if (!name || !surname || !email || !address || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Dati ordine mancanti" });
  }

  connection.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Errore nella transazione" });

    try {
      // 1️⃣ Inserisci customer
      const insertCustomer = `INSERT INTO customer (name, surname, email, address) VALUES (?, ?, ?, ?)`;
      connection.query(insertCustomer, [name, surname, email, address], (err, customerResult) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ error: "Errore inserimento customer" });
          });
        }

        const customerId = customerResult.insertId;

        // 2️⃣ Inserisci ordine
        const insertOrder = `
  INSERT INTO orders (customer_id, amount, status, date, free_shipping)
  VALUES (?, ?, 'pending', NOW(), ?)
`;
        connection.query(insertOrder, [customerId, amount, free_shipping], (err, orderResult) => {
          if (err) {
            console.error("Errore inserimento ordine:", err);
            return connection.rollback(() => {
              res.status(500).json({ error: "Errore inserimento ordine" });
            });
          }

          const orderId = orderResult.insertId;

          // Inserisci articoli ordine (rimane invariato)
          const insertItems = `
    INSERT INTO order_item (product_id, order_id, quantity, unit_price, product_name)
    VALUES ?
  `;
          const itemsValues = cartItems.map((item) => [
            item.id,
            orderId,
            item.quantity,
            item.sales_price,
            item.name,
          ]);

          connection.query(insertItems, [itemsValues], (err) => {
            if (err) {
              console.error("Errore inserimento articoli ordine:", err);
              return connection.rollback(() => {
                res.status(500).json({ error: "Errore inserimento articoli ordine" });
              });
            }

            connection.commit((err) => {
              if (err) {
                console.error("Errore commit transazione:", err);
                return connection.rollback(() => {
                  res.status(500).json({ error: "Errore commit transazione" });
                });
              }

              res.status(201).json({
                message: "Ordine creato con successo",
                order_id: orderId,
              });
            });
          });
        });

      });
    } catch (err) {
      connection.rollback(() => {
        res.status(500).json({ error: "Errore imprevisto nella creazione dell'ordine" });
      });
    }
  });
});

module.exports = router;
