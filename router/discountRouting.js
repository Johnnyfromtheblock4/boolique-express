const express = require("express");
const router = express.Router();
const connection = require("../data/db");

// ✅ Valida codice sconto
router.post("/validate", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, message: "Codice mancante" });
  }

  const query = `
    SELECT * FROM discount_code
    WHERE code = ?
      AND active = 1
      AND valid_from <= NOW()
      AND valid_to >= NOW()
      AND used_count < max_uses
    LIMIT 1
  `;

  connection.query(query, [code], (err, results) => {
    if (err) {
      console.error("❌ Errore validazione codice sconto:", err);
      return res.status(500).json({ valid: false, message: "Errore server" });
    }

    if (results.length === 0) {
      return res.json({ valid: false, message: "Codice sconto non valido" });
    }

    const discount = results[0];
    res.json({
      valid: true,
      percent: parseFloat(discount.discount_percent),
      message: "Codice sconto valido"
    });

  });
});

module.exports = router;
