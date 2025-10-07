// CRUD (index, show, post, put, patch, delete) e query e slug

// ROB

const connection = require("../data/db");

const index = (req, res) => {
  const { minId, maxId } = req.query;

  let sql = `
    SELECT 
      p.id, p.name, p.price, p.description,p.slug,
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
          imagesMap[img.product_id].push(req.imagePath + img.image_url);
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

      product.images = imagesResults.map(img => req.imagePath + img.image_url);
      product.image = product.images.length > 0 ? product.images[0] : null;

      res.json(product);
    });
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

  connection.query(query, [name, price, description], (err, res) => {
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
