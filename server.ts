import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "maisquecardapio",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize Database Tables
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
  
  await connection.execute(`CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    max_products INT,
    enable_ai TINYINT DEFAULT 0,
    enable_reservations TINYINT DEFAULT 0,
    enable_automation TINYINT DEFAULT 0
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS establishments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    owner_whatsapp VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    plan_id INT,
    status VARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available TINYINT DEFAULT 1,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS neighborhoods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    address TEXT,
    neighborhood_id INT,
    total DECIMAL(10,2),
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50),
    items_text TEXT,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    number INT NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS commands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    table_id INT,
    waiter_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    UNIQUE KEY unique_phone (establishment_id, phone)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS settings (
    establishment_id INT NOT NULL,
    \`key\` VARCHAR(255) NOT NULL,
    value TEXT,
    PRIMARY KEY (establishment_id, \`key\`),
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    table_id INT,
    reservation_time DATETIME NOT NULL,
    guests INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  )`);

  // Seed demo data if empty
  const [plans] = await connection.execute("SELECT COUNT(*) as count FROM plans");
  if ((plans as any)[0].count === 0) {
    await connection.execute("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation) VALUES (?, ?, ?, ?, ?, ?)", ["Gratuito", 0, 10, 0, 0, 0]);
    await connection.execute("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation) VALUES (?, ?, ?, ?, ?, ?)", ["Premium", 49.90, 100, 1, 1, 1]);
    await connection.execute("INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id) VALUES (?, ?, ?, ?, ?)", ["MaisQueCardapio Demo", "demo", "5511999999999", "admin123", 2]);
    
    const [est] = await connection.execute("SELECT id FROM establishments WHERE slug = ?", ["demo"]);
    const estId = (est as any)[0].id;

    const settings = [
      [estId, "pix_key", "seu-pix@email.com"],
      [estId, "whatsapp_kitchen", "5511999999999"],
      [estId, "whatsapp_cashier", "5511999999999"],
      [estId, "store_name", "MaisQueCardapio Demo"],
      [estId, "primary_color", "#f97316"],
      [estId, "is_open", "1"],
    ];
    for (const s of settings) await connection.execute("INSERT INTO settings (establishment_id, \`key\`, value) VALUES (?, ?, ?)", s);
    
    await connection.execute("INSERT INTO categories (establishment_id, name) VALUES (?, ?)", [estId, "Hambúrgueres"]);
    await connection.execute("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)", [estId, 1, "X-Burger", "Pão, carne 150g, queijo", 25.90, "https://picsum.photos/seed/burger1/400/300"]);
    await connection.execute("INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)", [estId, "Centro", 5.00]);
    for (let i = 1; i <= 5; i++) await connection.execute("INSERT INTO tables (establishment_id, number) VALUES (?, ?)", [estId, i]);
    
    console.log("Demo data seeded");
  }

  connection.release();
  console.log("Database initialized");
  } catch (error) {
    console.error("Database initialization error:", error);
    process.exit(1);
  }
}

initDatabase();

const app = express();
app.use(express.json());

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "superadmin-jwt-secret-change-in-production";
const SUPERADMIN_USER = process.env.SUPERADMIN_USER || "superadmin";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "admin123";

// SuperAdmin Auth Middleware
const superAdminAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Token não fornecido. Acesso não autorizado." });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};

// SuperAdmin Login Endpoint (public - no auth required)
app.post("/api/superadmin/login", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username e password são obrigatórios." });
  }
  
  if (username === SUPERADMIN_USER && password === SUPERADMIN_PASSWORD) {
    const token = jwt.sign(
      { role: "superadmin", username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token, message: "Login realizado com sucesso." });
  } else {
    res.status(401).json({ error: "Credenciais inválidas." });
  }
});

// Verify token endpoint
app.get("/api/superadmin/verify", async (req: any, res) => {
  res.json({ valid: true, user: req.user });
});

// Protect all /api/superadmin routes (except login which is defined above)
app.use("/api/superadmin", (req: any, res: any, next: any) => {
  // Skip auth for login endpoint
  if (req.path === "/login" && req.method === "POST") {
    return next();
  }
  return superAdminAuthMiddleware(req, res, next);
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// Middleware
const getEstablishment = async (req: any, res: any, next: any) => {
  const slug = req.headers['x-establishment-slug'];
  if (!slug && !req.path.startsWith('/api/public')) return res.status(400).json({ error: "Establishment slug required" });
  if (!slug) return next();
  const [rows] = await pool.execute("SELECT * FROM establishments WHERE slug = ?", [slug]);
  if (!(rows as any)[0]) return res.status(404).json({ error: "Not found" });
  req.establishment = (rows as any)[0];
  next();
};

// Routes (abbreviated for brevity - same logic as SQLite version but with pool.execute)
app.post("/api/public/register", async (req, res) => {
  const { name, slug, owner_whatsapp, password } = req.body;
  try {
    const [result] = await pool.execute("INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id) VALUES (?, ?, ?, ?, ?)", [name, slug, owner_whatsapp, password, 1]);
    res.json({ id: (result as any).insertId, slug });
  } catch (e) { res.status(400).json({ error: "Slug em uso" }); }
});

app.get("/api/public/establishments/:slug", async (req, res) => {
  const [rows] = await pool.execute("SELECT id, name, slug, status FROM establishments WHERE slug = ?", [req.params.slug]);
  if (!(rows as any)[0]) return res.status(404).json({ error: "Não encontrado" });
  res.json((rows as any)[0]);
});

app.get("/api/superadmin/establishments", async (req, res) => {
  const [rows] = await pool.execute("SELECT e.*, p.name as plan_name FROM establishments e JOIN plans p ON e.plan_id = p.id ORDER BY e.created_at DESC");
  res.json(rows);
});

app.get("/api/superadmin/plans", async (req, res) => {
  const [rows] = await pool.execute("SELECT * FROM plans");
  res.json(rows);
});

app.use("/api/e", getEstablishment);

app.get("/api/e/categories", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM categories WHERE establishment_id = ?", [req.establishment.id]);
  res.json(rows);
});

app.get("/api/e/products", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM products WHERE establishment_id = ?", [req.establishment.id]);
  res.json(rows);
});

app.post("/api/e/products", async (req: any, res) => {
  const { category_id, name, description, price, image_url } = req.body;
  const [result] = await pool.execute("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)", [req.establishment.id, category_id, name, description, price, image_url]);
  res.json({ id: (result as any).insertId });
});

app.get("/api/e/neighborhoods", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM neighborhoods WHERE establishment_id = ?", [req.establishment.id]);
  res.json(rows);
});

app.get("/api/e/tables", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM tables WHERE establishment_id = ? ORDER BY number", [req.establishment.id]);
  res.json(rows);
});

app.get("/api/e/orders", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM orders WHERE establishment_id = ? ORDER BY created_at DESC LIMIT 50", [req.establishment.id]);
  res.json(rows);
});

app.post("/api/e/orders", async (req: any, res) => {
  const { customer_name, customer_phone, address, neighborhood_id, total, payment_method, type, items_text } = req.body;
  const [result] = await pool.execute("INSERT INTO orders (establishment_id, customer_name, customer_phone, address, neighborhood_id, total, payment_method, type, items_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.establishment.id, customer_name, customer_phone, address, neighborhood_id, total, payment_method, type, items_text]);
  res.json({ id: (result as any).insertId });
});

app.get("/api/e/settings", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM settings WHERE establishment_id = ?", [req.establishment.id]);
  const obj = (rows as any[]).reduce((a, c) => { a[c.key] = c.value; return a; }, {});
  res.json(obj);
});

app.post("/api/e/settings", async (req: any, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    await pool.execute("INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?", [req.establishment.id, k, v, v]);
  }
  res.json({ success: true });
});

app.get("/api/e/reservations", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT r.*, t.number as table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id WHERE r.establishment_id = ? ORDER BY r.reservation_time", [req.establishment.id]);
  res.json(rows);
});

// Static files
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
}

const PORT = process.env.PORT || 80;
app.listen(PORT, "0.0.0.0", () => console.log(`Server on ${PORT}`));
