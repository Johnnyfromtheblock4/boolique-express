const express = require("express");
const router = express.Router();
const connection = require("../data/db");

router.post("/", (req, res) => {
  const { name, surname, email, address, amount, free_shipping, cartItems, discount_code } = req.body;

  if (!name || !surname || !email || !address || !cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Dati ordine mancanti" });
  }

  connection.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Errore nella transazione" });

    try {
      const checkAndApplyDiscount = (callback) => {
        if (!discount_code) return callback(null, amount); // Nessuno sconto

        const sql = `
          SELECT * FROM discount_code 
          WHERE code = ? AND active = 1 
          AND valid_from <= NOW() AND valid_to >= NOW()
          AND used_count < max_uses
        `;
        connection.query(sql, [discount_code], (err, result) => {
          if (err) return callback(err);
          if (result.length === 0) {
            return callback(new Error("Codice sconto non valido o scaduto"));
          }

          const discount = result[0];
          const sconto = (amount * discount.discount_percent) / 100;
          const newAmount = amount - sconto;

          // Aggiorna conteggio usi
          connection.query(
            "UPDATE discount_code SET used_count = used_count + 1 WHERE id = ?",
            [discount.id],
            (err2) => {
              if (err2) return callback(err2);
              callback(null, newAmount);
            }
          );
        });
      };

      checkAndApplyDiscount((err, finalAmount) => {
        if (err) {
          return connection.rollback(() => {
            res.status(400).json({ error: err.message });
          });
        }

        // 1️⃣ Inserisci customer
        const insertCustomer = `INSERT INTO customer (name, surname, email, address) VALUES (?, ?, ?, ?)`;
        connection.query(insertCustomer, [name, surname, email, address], (err, customerResult) => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ error: "Errore inserimento customer" });
            });
          }

          const customerId = customerResult.insertId;

          // 2️⃣ Inserisci ordine con importo scontato
          const insertOrder = `
            INSERT INTO orders (customer_id, amount, status, date, free_shipping, discount_code)
            VALUES (?, ?, 'pending', NOW(), ?, ?)
          `;
          connection.query(insertOrder, [customerId, finalAmount, free_shipping, discount_code || null], (err, orderResult) => {
            if (err) {
              console.error("Errore inserimento ordine:", err);
              return connection.rollback(() => {
                res.status(500).json({ error: "Errore inserimento ordine" });
              });
            }

            const orderId = orderResult.insertId;

            // 3️⃣ Inserisci articoli
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
                  final_amount: finalAmount,
                });
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
