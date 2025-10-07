// productsController.js
// CRUD (index, show, store, update, patch, destroy) e gestione immagini
import connection from "../data/db.js";
import slugify from "slugify";

const IMAGE_BASE_PATH = "/imgs/"; // percorso pubblico delle immagini

// LISTA PRODOTTI
const index = (req, res) => {
  const { minId, maxId } = req.query;

  let sql = `
    SELECT 
      p.id, p.name, p.price, p.description, p.slug,
      c.name AS category, b.name AS brand
    FROM products p
    LEFT JOIN category c ON p.category_id = c.id
    LEFT JOIN brand b ON p.brand_id = b.id
  `;

  const params = [];

  if (minId && maxId) {
    sql += " WHERE p.id BETWEEN ? AND ?";
    params.push(Number(minId), Number(maxId));
  }

  connection.query(sql, params, (err, products) => {
    if (err) return res.status(500).json({ error: "Fallita ricerca dei prodotti" });
    if (products.length === 0) return res.json([]);

    const productIds = products.map(p => p.id);

    const imagesSql = `
      SELECT * 
      FROM products_image 
      WHERE product_id IN (?) AND sort_order IN (0,1)
      ORDER BY product_id, sort_order ASC
    `;

    connection.query(imagesSql, [productIds], (err, imagesResults) => {
      if (err) return res.status(500).json({ error: "Fallita ricerca immagini" });

      const imagesMap = {};
      imagesResults.forEach(img => {
        if (!imagesMap[img.product_id]) imagesMap[img.product_id] = [];
        if (imagesMap[img.product_id].length < 2) {
          imagesMap[img.product_id].push(IMAGE_BASE_PATH + img.image_url);
        }
      });

      const productsWithImages = products.map(product => ({
        ...product,
        images: imagesMap[product.id] || [],
        image: imagesMap[product.id] ? imagesMap[product.id][0] : null
      }));

      res.json(productsWithImages);
    });
  });
};

// MOSTRA SINGOLO PRODOTTO
const show = (req, res) => {
  const { param } = req.params;

  let query, values;
  if (!isNaN(param)) {
    query = `
      SELECT 
        p.*, 
        c.name AS category, 
        b.name AS brand
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN brand b ON p.brand_id = b.id
      WHERE p.id = ?
    `;
    values = [param];
  } else {
    query = `
      SELECT 
        p.*, 
        c.name AS category, 
        b.name AS brand
      FROM products p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN brand b ON p.brand_id = b.id
      WHERE p.slug = ?
    `;
    values = [param];
  }

  connection.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: "Query fallita: " + err });
    if (results.length === 0) return res.status(404).json({ error: "Prodotto non trovato" });

    const product = results[0];

    const imagesSql = `
      SELECT image_url 
      FROM products_image
      WHERE product_id = ?
      ORDER BY sort_order ASC
    `;

    connection.query(imagesSql, [product.id], (err, imagesResults) => {
      if (err) return res.status(500).json({ error: "Errore recupero immagini: " + err });

      product.images = imagesResults.map(img => IMAGE_BASE_PATH + img.image_url);
      product.image = product.images.length > 0 ? product.images[0] : null;

      res.json(product);
    });
  });
};

// CREA NUOVO PRODOTTO
const store = (req, res) => {
  try {
    const { name, price, color, size, description, brand, category } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    if (!name || !price || !brand || !category) {
      return res.status(400).json({ error: "Dati obbligatori mancanti" });
    }

    const findOrCreateBrand = (cb) => {
      connection.query("SELECT id FROM brands WHERE name=?", [brand], (err, results) => {
        if (err) return cb(err);
        if (results.length > 0) return cb(null, results[0].id);
        connection.query("INSERT INTO brands (name) VALUES (?)", [brand], (err2, res2) => {
          if (err2) return cb(err2);
          cb(null, res2.insertId);
        });
      });
    };

    const findOrCreateCategory = (cb) => {
      connection.query("SELECT id FROM categories WHERE name=?", [category], (err, results) => {
        if (err) return cb(err);
        if (results.length > 0) return cb(null, results[0].id);
        connection.query("INSERT INTO categories (name) VALUES (?)", [category], (err2, res2) => {
          if (err2) return cb(err2);
          cb(null, res2.insertId);
        });
      });
    };

    findOrCreateBrand((err, brandId) => {
      if (err) return res.status(500).json({ error: "Errore brand: " + err });
      findOrCreateCategory((err2, categoryId) => {
        if (err2) return res.status(500).json({ error: "Errore categoria: " + err2 });

        const q = `
          INSERT INTO products (name, price, color, size, description, slug, brand_id, category_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(q, [name, price, color, size, description, slug, brandId, categoryId], (err3, resProd) => {
          if (err3) return res.status(500).json({ error: "Errore prodotto: " + err3 });

          const productId = resProd.insertId;

          if (req.files && req.files.length > 0) {
            const imgQuery = `
              INSERT INTO products_image (product_id, image_url, sort_order)
              VALUES ?
            `;
            const values = req.files.map((file, index) => [productId, file.filename, index]);

            connection.query(imgQuery, [values], (err4) => {
              if (err4) return res.status(500).json({ error: "Errore inserimento immagini: " + err4 });
              res.status(201).json({ result: true, message: "Prodotto e immagini salvati", productId, slug });
            });
          } else {
            res.status(201).json({ result: true, message: "Prodotto salvato senza immagini", productId, slug });
          }
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// CANCELLA PRODOTTO
const destroy = (req, res) => {
  const { id } = req.params;
  connection.query("DELETE FROM products WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Errore nel cancellare il prodotto" });
    res.sendStatus(204);
  });
};

// UPDATE PRODOTTO (tutti i campi)
const update = (req, res) => {
  const { id } = req.params;
  const { name, price, color, size, description, brand, category } = req.body;
  if (!name || !price || !brand || !category) return res.status(400).json({ error: "Dati obbligatori mancanti" });

  const slug = slugify(name, { lower: true, strict: true });

  const findOrCreateBrand = (cb) => {
    connection.query("SELECT id FROM brands WHERE name=?", [brand], (err, results) => {
      if (err) return cb(err);
      if (results.length > 0) return cb(null, results[0].id);
      connection.query("INSERT INTO brands (name) VALUES (?)", [brand], (err2, res2) => {
        if (err2) return cb(err2);
        cb(null, res2.insertId);
      });
    });
  };

  const findOrCreateCategory = (cb) => {
    connection.query("SELECT id FROM categories WHERE name=?", [category], (err, results) => {
      if (err) return cb(err);
      if (results.length > 0) return cb(null, results[0].id);
      connection.query("INSERT INTO categories (name) VALUES (?)", [category], (err2, res2) => {
        if (err2) return cb(err2);
        cb(null, res2.insertId);
      });
    });
  };

  findOrCreateBrand((err, brandId) => {
    if (err) return res.status(500).json({ error: err });
    findOrCreateCategory((err2, categoryId) => {
      if (err2) return res.status(500).json({ error: err2 });

      const q = `
        UPDATE products
        SET name=?, price=?, color=?, size=?, description=?, slug=?, brand_id=?, category_id=?
        WHERE id=?
      `;
      connection.query(q, [name, price, color, size, description, slug, brandId, categoryId, id], (err3) => {
        if (err3) return res.status(500).json({ error: "Errore aggiornamento prodotto: " + err3 });

        // Aggiorna immagini se presenti
        if (req.files && req.files.length > 0) {
          connection.query("DELETE FROM products_image WHERE product_id=?", [id], (err4) => {
            if (err4) return res.status(500).json({ error: "Errore cancellazione immagini: " + err4 });
            const imgQuery = "INSERT INTO products_image (product_id, image_url, sort_order) VALUES ?";
            const values = req.files.map((file, index) => [id, file.filename, index]);
            connection.query(imgQuery, [values], (err5) => {
              if (err5) return res.status(500).json({ error: "Errore inserimento immagini: " + err5 });
              res.status(200).json({ result: true, message: "Prodotto aggiornato con immagini" });
            });
          });
        } else {
          res.status(200).json({ result: true, message: "Prodotto aggiornato senza modificare immagini" });
        }
      });
    });
  });
};

// PATCH PRODOTTO (aggiorna campi parziali)
const patch = (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const updates = [];
  const values = [];

  if (fields.name) {
    updates.push("name=?");
    values.push(fields.name);
    updates.push("slug=?");
    values.push(slugify(fields.name, { lower: true, strict: true }));
  }
  if (fields.price) { updates.push("price=?"); values.push(fields.price); }
  if (fields.color) { updates.push("color=?"); values.push(fields.color); }
  if (fields.size) { updates.push("size=?"); values.push(fields.size); }
  if (fields.description) { updates.push("description=?"); values.push(fields.description); }

  const finalizeUpdate = () => {
    if (updates.length === 0) return res.status(400).json({ error: "Nessun campo da aggiornare" });
    const q = `UPDATE products SET ${updates.join(", ")} WHERE id=?`;
    values.push(id);
    connection.query(q, values, (err) => {
      if (err) return res.status(500).json({ error: "Errore aggiornamento: " + err });
      res.status(200).json({ result: true, message: "Prodotto aggiornato" });
    });
  };

  // gestione brand/categoria opzionali
  if (fields.brand) {
    connection.query("SELECT id FROM brands WHERE name=?", [fields.brand], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length > 0) { updates.push("brand_id=?"); values.push(results[0].id); finalizeUpdate(); }
      else {
        connection.query("INSERT INTO brands (name) VALUES (?)", [fields.brand], (err2, res2) => {
          if (err2) return res.status(500).json({ error: err2 });
          updates.push("brand_id=?"); values.push(res2.insertId); finalizeUpdate();
        });
      }
    });
  } else if (fields.category) {
    connection.query("SELECT id FROM categories WHERE name=?", [fields.category], (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length > 0) { updates.push("category_id=?"); values.push(results[0].id); finalizeUpdate(); }
      else {
        connection.query("INSERT INTO categories (name) VALUES (?)", [fields.category], (err2, res2) => {
          if (err2) return res.status(500).json({ error: err2 });
          updates.push("category_id=?"); values.push(res2.insertId); finalizeUpdate();
        });
      }
    });
  } else {
    finalizeUpdate();
  }
};

export { index, show, store, destroy, update, patch };
