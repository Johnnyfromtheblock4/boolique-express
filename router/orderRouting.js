const express = require("express");
const router = express.Router();
const connection = require("../data/db");

router.post("/", (req, res) => {
  const { name, surname, email, address, amount, free_shipping, cartItems, discount_code } = req.body;

  if (!name || !surname || !email || !address || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Dati ordine mancanti" });
  }

  connection.beginTransaction(err => {
    if (err) return res.status(500).json({ error: "Errore nella transazione" });

    try {
      // 1️⃣ Controllo e applicazione sconto
      const checkAndApplyDiscount = (callback) => {
        if (!discount_code) return callback(null, amount, null); // Nessuno sconto

        const sql = `
          SELECT * FROM discount_code 
          WHERE code = ? AND active = 1 
          AND valid_from <= NOW() AND valid_to >= NOW()
          AND used_count < max_uses
        `;
        connection.query(sql, [discount_code], (err, result) => {
          if (err) return callback(err);
          if (result.length === 0) return callback(new Error("Codice sconto non valido o scaduto"));

          const discount = result[0];
          const sconto = (amount * parseFloat(discount.discount_percent)) / 100;
          const newAmount = amount - sconto;

          // Aggiorno used_count
          connection.query(
            "UPDATE discount_code SET used_count = used_count + 1 WHERE id = ?",
            [discount.id],
            (err2) => {
              if (err2) return callback(err2);
              callback(null, newAmount, discount.id); // passo l'ID del codice sconto
            }
          );
        });
      };

      // 2️⃣ Eseguo inserimento customer, ordine e articoli
      checkAndApplyDiscount((err, finalAmount, discountId) => {
        if (err) {
          return connection.rollback(() => res.status(400).json({ error: err.message }));
        }

        // Inserisco customer
        const insertCustomer = `INSERT INTO customer (name, surname, email, address) VALUES (?, ?, ?, ?)`;
        connection.query(insertCustomer, [name, surname, email, address], (err, customerResult) => {
          if (err) return connection.rollback(() => res.status(500).json({ error: "Errore inserimento customer" }));

          const customerId = customerResult.insertId;

          // Inserisco ordine con FK discount_code_id
          const insertOrder = `
            INSERT INTO orders (customer_id, amount, status, date, free_shipping, discount_code_id)
            VALUES (?, ?, 'pending', NOW(), ?, ?)
          `;
          connection.query(insertOrder, [customerId, finalAmount, free_shipping, discountId], (err, orderResult) => {
            if (err) return connection.rollback(() => res.status(500).json({ error: "Errore inserimento ordine" }));

            const orderId = orderResult.insertId;

            // Inserisco articoli
            const insertItems = `
              INSERT INTO order_item (product_id, order_id, quantity, unit_price, product_name)
              VALUES ?
            `;
            const itemsValues = cartItems.map(item => [item.id, orderId, item.quantity, item.sales_price, item.name]);

            connection.query(insertItems, [itemsValues], (err) => {
              if (err) return connection.rollback(() => res.status(500).json({ error: "Errore inserimento articoli ordine" }));

              // Commit finale
              connection.commit(err => {
                if (err) return connection.rollback(() => res.status(500).json({ error: "Errore commit transazione" }));

                res.status(201).json({
                  message: "Ordine creato con successo",
                  order_id: orderId,
                  final_amount: finalAmount,
                });
              });
            });
          });
        });
      });

    } catch (err) {
      connection.rollback(() => res.status(500).json({ error: "Errore imprevisto nella creazione dell'ordine" }));
    }
  });
});

module.exports = router;
