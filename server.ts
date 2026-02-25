import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("maisquecardapio.db");

// Initialize Database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    max_products INTEGER,
    enable_ai INTEGER DEFAULT 0,
    enable_reservations INTEGER DEFAULT 0,
    enable_automation INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS establishments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_email TEXT NOT NULL,
    password TEXT NOT NULL,
    plan_id INTEGER,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    is_available INTEGER DEFAULT 1,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS neighborhoods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    delivery_fee REAL NOT NULL,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    neighborhood_id INTEGER,
    total REAL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT,
    items_text TEXT,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  );

  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    number INTEGER NOT NULL,
    status TEXT DEFAULT 'available',
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  );

  CREATE TABLE IF NOT EXISTS commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    table_id INTEGER,
    waiter_name TEXT,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    establishment_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (establishment_id, key),
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    table_id INTEGER,
    reservation_time DATETIME NOT NULL,
    guests INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
  );
`);
} catch (e) {
  console.error("Database Init Error:", e);
}

// Seed initial data if empty
const planCount = db.prepare("SELECT COUNT(*) as count FROM plans").get() as { count: number };
if (planCount.count === 0) {
  db.prepare("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation) VALUES (?, ?, ?, ?, ?, ?)")
    .run("Gratuito", 0, 10, 0, 0, 0);
  db.prepare("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation) VALUES (?, ?, ?, ?, ?, ?)")
    .run("Premium", 49.90, 100, 1, 1, 1);
  
  db.prepare("INSERT INTO establishments (name, slug, owner_email, password, plan_id) VALUES (?, ?, ?, ?, ?)")
    .run("MaisQueCardapio Demo", "demo", "admin@demo.com", "admin123", 2);

  const est = db.prepare("SELECT id FROM establishments WHERE slug = ?").get("demo") as { id: number };
  const estId = est.id;

  const setSetting = db.prepare("INSERT INTO settings (establishment_id, key, value) VALUES (?, ?, ?)");
  setSetting.run(estId, "pix_key", "seu-pix@email.com");
  setSetting.run(estId, "whatsapp_kitchen", "5511999999999");
  setSetting.run(estId, "whatsapp_cashier", "5511999999999");
  setSetting.run(estId, "store_name", "MaisQueCardapio Demo");
  setSetting.run(estId, "store_logo", "");
  setSetting.run(estId, "primary_color", "#f97316");
  setSetting.run(estId, "is_open", "1");
  setSetting.run(estId, "enable_reservations", "1");
  setSetting.run(estId, "evolution_enabled", "0");
  setSetting.run(estId, "enable_ai", "1");
  setSetting.run(estId, "ai_provider", "gemini");

  db.prepare("INSERT INTO categories (establishment_id, name) VALUES (?, ?)").run(estId, "Hambúrgueres");
  db.prepare("INSERT INTO categories (establishment_id, name) VALUES (?, ?)").run(estId, "Bebidas");

  db.prepare("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)")
    .run(estId, 1, "X-Burger Clássico", "Pão, carne 150g, queijo e maionese da casa.", 25.90, "https://picsum.photos/seed/burger1/400/300");
  
  db.prepare("INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)")
    .run(estId, "Centro", 5.00);

  for (let i = 1; i <= 5; i++) {
    db.prepare("INSERT INTO tables (establishment_id, number) VALUES (?, ?)").run(estId, i);
  }
}

const app = express();
app.use(express.json());

// Middleware to identify establishment
const getEstablishment = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const slug = req.headers['x-establishment-slug'] as string;
  if (!slug) {
    if (req.path.startsWith('/api/public')) return next();
    return res.status(400).json({ error: "Establishment slug required" });
  }
  const est = db.prepare("SELECT * FROM establishments WHERE slug = ?").get(slug) as any;
  if (!est) return res.status(404).json({ error: "Establishment not found" });
  (req as any).establishment = est;
  next();
};

// Public Routes (Registration, etc)
app.post("/api/public/register", (req, res) => {
  const { name, slug, owner_email, password } = req.body;
  try {
    const info = db.prepare("INSERT INTO establishments (name, slug, owner_email, password, plan_id) VALUES (?, ?, ?, ?, ?)")
      .run(name, slug, owner_email, password, 1);
    const estId = info.lastInsertRowid;
    
    // Default settings
    const setSetting = db.prepare("INSERT INTO settings (establishment_id, key, value) VALUES (?, ?, ?)");
    setSetting.run(estId, "store_name", name);
    setSetting.run(estId, "is_open", "1");
    setSetting.run(estId, "primary_color", "#f97316");
    
    res.json({ id: estId, slug });
  } catch (e) {
    res.status(400).json({ error: "Slug já em uso ou dados inválidos" });
  }
});

app.get("/api/public/establishments/:slug", (req, res) => {
  const est = db.prepare("SELECT id, name, slug, status FROM establishments WHERE slug = ?").get(req.params.slug);
  if (!est) return res.status(404).json({ error: "Não encontrado" });
  res.json(est);
});

// Superadmin Routes
app.get("/api/superadmin/establishments", (req, res) => {
  const ests = db.prepare(`
    SELECT e.*, p.name as plan_name 
    FROM establishments e 
    JOIN plans p ON e.plan_id = p.id
  `).all();
  res.json(ests);
});

app.get("/api/superadmin/plans", (req, res) => {
  const plans = db.prepare("SELECT * FROM plans").all();
  res.json(plans);
});

// Establishment Scoped Routes
app.use("/api/e", getEstablishment);
app.get("/api/e/categories", (req, res) => {
  const estId = (req as any).establishment.id;
  const categories = db.prepare("SELECT * FROM categories WHERE establishment_id = ?").all(estId);
  res.json(categories);
});

app.get("/api/e/products", (req, res) => {
  const estId = (req as any).establishment.id;
  const products = db.prepare("SELECT * FROM products WHERE establishment_id = ?").all(estId);
  res.json(products);
});

app.post("/api/e/products", (req, res) => {
  const estId = (req as any).establishment.id;
  const { category_id, name, description, price, image_url } = req.body;
  const info = db.prepare("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)")
    .run(estId, category_id, name, description, price, image_url);
  res.json({ id: info.lastInsertRowid });
});

app.put("/api/e/products/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  const { category_id, name, description, price, image_url, is_available } = req.body;
  db.prepare("UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_available = ? WHERE id = ? AND establishment_id = ?")
    .run(category_id, name, description, price, image_url, is_available ? 1 : 0, req.params.id, estId);
  res.json({ success: true });
});

app.delete("/api/e/products/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  db.prepare("DELETE FROM products WHERE id = ? AND establishment_id = ?").run(req.params.id, estId);
  res.json({ success: true });
});

app.get("/api/e/neighborhoods", (req, res) => {
  const estId = (req as any).establishment.id;
  const neighborhoods = db.prepare("SELECT * FROM neighborhoods WHERE establishment_id = ?").all(estId);
  res.json(neighborhoods);
});

app.post("/api/e/neighborhoods", (req, res) => {
  const estId = (req as any).establishment.id;
  const { name, delivery_fee } = req.body;
  const info = db.prepare("INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)")
    .run(estId, name, delivery_fee);
  res.json({ id: info.lastInsertRowid });
});

app.delete("/api/e/neighborhoods/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  db.prepare("DELETE FROM neighborhoods WHERE id = ? AND establishment_id = ?").run(req.params.id, estId);
  res.json({ success: true });
});

app.post("/api/e/categories", (req, res) => {
  const estId = (req as any).establishment.id;
  const { name } = req.body;
  const info = db.prepare("INSERT INTO categories (establishment_id, name) VALUES (?, ?)")
    .run(estId, name);
  res.json({ id: info.lastInsertRowid });
});

app.delete("/api/e/categories/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  db.prepare("DELETE FROM categories WHERE id = ? AND establishment_id = ?").run(req.params.id, estId);
  res.json({ success: true });
});

app.get("/api/e/tables", (req, res) => {
  const estId = (req as any).establishment.id;
  const tables = db.prepare("SELECT * FROM tables WHERE establishment_id = ? ORDER BY number ASC").all(estId);
  res.json(tables);
});

app.get("/api/e/commands", (req, res) => {
  const estId = (req as any).establishment.id;
  const commands = db.prepare(`
    SELECT c.*, t.number as table_number 
    FROM commands c 
    JOIN tables t ON c.table_id = t.id 
    WHERE c.status = 'open' AND c.establishment_id = ?
    ORDER BY c.created_at DESC
  `).all(estId);
  res.json(commands);
});

app.post("/api/e/commands", (req, res) => {
  const estId = (req as any).establishment.id;
  const { table_id, waiter_name } = req.body;
  const info = db.prepare("INSERT INTO commands (establishment_id, table_id, waiter_name) VALUES (?, ?, ?)")
    .run(estId, table_id, waiter_name);
  res.json({ id: info.lastInsertRowid });
});

app.put("/api/e/commands/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  const { status } = req.body;
  db.prepare("UPDATE commands SET status = ? WHERE id = ? AND establishment_id = ?").run(status, req.params.id, estId);
  res.json({ success: true });
});

app.get("/api/e/orders", (req, res) => {
  const estId = (req as any).establishment.id;
  const orders = db.prepare("SELECT * FROM orders WHERE establishment_id = ? ORDER BY created_at DESC LIMIT 50").all(estId);
  res.json(orders);
});

app.post("/api/e/orders", (req, res) => {
  const estId = (req as any).establishment.id;
  const { customer_name, customer_phone, address, neighborhood_id, total, payment_method, type, items_text } = req.body;
  const info = db.prepare(`
    INSERT INTO orders (establishment_id, customer_name, customer_phone, address, neighborhood_id, total, payment_method, type, items_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(estId, customer_name, customer_phone, address, neighborhood_id, total, payment_method, type, items_text);
  
  const orderId = info.lastInsertRowid;

  // Evolution API Integration
  const settings = db.prepare("SELECT * FROM settings WHERE establishment_id = ?").all(estId).reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  if (settings.evolution_enabled === "1" && settings.evolution_api_url) {
    const message = `*Pedido #${orderId} Recebido!*\n\n*Cliente:* ${customer_name}\n*Tipo:* ${type === 'table' ? 'Mesa' : 'Delivery'}\n\n*Itens:*\n${items_text}\n\n*Total: R$ ${total.toFixed(2)}*\n*Pagamento:* ${payment_method}`;
    
    const targetNumber = type === 'table' ? settings.whatsapp_kitchen : settings.whatsapp_cashier;

    if (targetNumber) {
      axios.post(`${settings.evolution_api_url}/message/sendText/${settings.evolution_instance}`, {
        number: targetNumber,
        text: message
      }, {
        headers: {
          'apikey': settings.evolution_api_key
        }
      }).catch(err => console.error("Evolution API Error:", err));
    }
  }

  res.json({ id: orderId });
});

app.post("/api/e/tables", (req, res) => {
  const estId = (req as any).establishment.id;
  const { number } = req.body;
  try {
    const info = db.prepare("INSERT INTO tables (establishment_id, number) VALUES (?, ?)")
      .run(estId, number);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: "Mesa já existe" });
  }
});

app.delete("/api/e/tables/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  db.prepare("DELETE FROM tables WHERE id = ? AND establishment_id = ?").run(req.params.id, estId);
  res.json({ success: true });
});

app.get("/api/e/settings", (req, res) => {
  const estId = (req as any).establishment.id;
  const settings = db.prepare("SELECT * FROM settings WHERE establishment_id = ?").all(estId);
  const settingsObj = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(settingsObj);
});

app.post("/api/e/settings", (req, res) => {
  const estId = (req as any).establishment.id;
  const settings = req.body;
  const upsert = db.prepare("INSERT OR REPLACE INTO settings (establishment_id, key, value) VALUES (?, ?, ?)");
  const transaction = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      upsert.run(estId, key, value);
    }
  });
  transaction(settings);
  res.json({ success: true });
});

// Reservations API
app.get("/api/e/reservations", (req, res) => {
  const estId = (req as any).establishment.id;
  const reservations = db.prepare(`
    SELECT r.*, t.number as table_number 
    FROM reservations r 
    LEFT JOIN tables t ON r.table_id = t.id 
    WHERE r.establishment_id = ?
    ORDER BY r.reservation_time ASC
  `).all(estId);
  res.json(reservations);
});

app.post("/api/e/reservations", (req, res) => {
  const estId = (req as any).establishment.id;
  const { customer_name, customer_phone, table_id, reservation_time, guests } = req.body;
  const info = db.prepare(`
    INSERT INTO reservations (establishment_id, customer_name, customer_phone, table_id, reservation_time, guests)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(estId, customer_name, customer_phone, table_id, reservation_time, guests);
  res.json({ id: info.lastInsertRowid });
});

app.put("/api/e/reservations/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  const { status } = req.body;
  db.prepare("UPDATE reservations SET status = ? WHERE id = ? AND establishment_id = ?").run(status, req.params.id, estId);
  res.json({ success: true });
});

app.delete("/api/e/reservations/:id", (req, res) => {
  const estId = (req as any).establishment.id;
  db.prepare("DELETE FROM reservations WHERE id = ? AND establishment_id = ?").run(req.params.id, estId);
  res.json({ success: true });
});

// Vite middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
