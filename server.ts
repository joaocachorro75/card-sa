import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Criar pasta de uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
    }
  }
});

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
    paid_until DATE NULL,
    trial_ends_at DATE NULL,
    last_payment_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  )`);
  
  // Tabela de assinaturas para controle de renovação
  await connection.execute(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    plan_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'paused', 'cancelled', 'pending', 'expired') DEFAULT 'pending',
    payment_method VARCHAR(50),
    start_date DATE,
    end_date DATE,
    last_payment DATE,
    next_payment DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  )`);
  
  // Tabela de lembretes enviados
  await connection.execute(`CREATE TABLE IF NOT EXISTS reminders_sent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE CASCADE
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
    customer_email VARCHAR(255),
    address TEXT,
    address_number VARCHAR(20),
    address_complement VARCHAR(255),
    address_reference VARCHAR(255),
    neighborhood_id INT,
    total DECIMAL(10,2),
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    pix_code TEXT,
    pix_qrcode TEXT,
    pix_expires_at DATETIME,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    type VARCHAR(50),
    items_text TEXT,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  // Tabela de pagamentos PIX
  await connection.execute(`CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NULL,
    establishment_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    pix_code TEXT,
    pix_qrcode TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at DATETIME NULL,
    confirmed_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  // Corrige tabela existente para permitir order_id NULL (pagamentos de assinatura)
  try {
    await connection.execute(`ALTER TABLE payments MODIFY COLUMN order_id INT NULL`);
  } catch (e: any) {
    if (!e.message.includes('Unknown column')) console.log('payments já permite NULL');
  }

  // Tabela de histórico de status do pedido
  await connection.execute(`CREATE TABLE IF NOT EXISTS order_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by VARCHAR(50) DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);

  // Tabela de clientes estendida
  await connection.execute(`CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    establishment_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    address TEXT,
    address_number VARCHAR(20),
    address_complement VARCHAR(255),
    address_reference VARCHAR(255),
    neighborhood_id INT,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_order_at DATETIME NULL,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    UNIQUE KEY unique_phone (establishment_id, phone)
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

  // ========================================
  // MIGRATION: Adicionar colunas faltantes
  // ========================================
  console.log('🔄 Verificando colunas faltantes na tabela orders...');
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'customer_email'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255)`);
      console.log('✅ Coluna customer_email adicionada');
    } else {
      console.log('✓ Coluna customer_email já existe');
    }
  } catch (e) { 
    console.log('❌ Erro ao verificar/adicionar customer_email:', e); 
  }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'address_number'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN address_number VARCHAR(20)`);
      console.log('✅ Coluna address_number adicionada');
    }
  } catch (e) { console.log('Erro address_number:', e); }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'address_complement'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN address_complement VARCHAR(255)`);
      console.log('✅ Coluna address_complement adicionada');
    }
  } catch (e) { console.log('Erro address_complement:', e); }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'address_reference'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN address_reference VARCHAR(255)`);
      console.log('✅ Coluna address_reference adicionada');
    }
  } catch (e) { console.log('Erro address_reference:', e); }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'payment_status'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending'`);
      console.log('✅ Coluna payment_status adicionada');
    }
  } catch (e) { console.log('Erro payment_status:', e); }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'pix_code'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN pix_code TEXT`);
      console.log('✅ Coluna pix_code adicionada');
    }
  } catch (e) { console.log('Erro pix_code:', e); }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'pix_qrcode'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN pix_qrcode TEXT`);
      console.log('✅ Coluna pix_qrcode adicionada');
    }
  } catch (e) { console.log('Erro pix_qrcode:', e); }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'pix_expires_at'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN pix_expires_at DATETIME`);
      console.log('✅ Coluna pix_expires_at adicionada');
    }
  } catch (e) { console.log('Erro pix_expires_at:', e); }
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM orders LIKE 'delivery_fee'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0`);
      console.log('✅ Coluna delivery_fee adicionada');
    }
  } catch (e) { console.log('Erro delivery_fee:', e); }
  
  console.log('✅ Migration concluída!');

  // Seed demo data if empty
  const [plans] = await connection.execute("SELECT COUNT(*) as count FROM plans");
  if ((plans as any)[0].count === 0) {
    await connection.execute("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation) VALUES (?, ?, ?, ?, ?, ?)", ["Gratuito", 0, 10, 0, 0, 0]);
    await connection.execute("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation) VALUES (?, ?, ?, ?, ?, ?)", ["Premium", 49.90, 100, 1, 1, 1]);
    await connection.execute("INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id) VALUES (?, ?, ?, ?, ?)", ["MaisQueCardapio Demo", "demo", "5511999999999", "admin123", 2]);
    
    const [est] = await connection.execute("SELECT id FROM establishments WHERE slug = ?", ["demo"]);
    const estId = (est as any)[0].id;

    const settings = [
      [estId, "pix_key", "11999999999"],
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

// Função para normalizar número de WhatsApp (formato internacional 55XXXXXXXXXXX)
function normalizeWhatsApp(phone: string): string {
  if (!phone) return '';
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  // Se não tem código do país, adiciona 55 (Brasil)
  if (cleaned.length <= 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  // Se tem 13 dígitos e começa com 55, está correto
  // Se tem 12 dígitos (55 + DDD + 8 dígitos), adiciona 9 após DDD
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    const ddd = cleaned.substring(2, 4);
    const numero = cleaned.substring(4);
    cleaned = '55' + ddd + '9' + numero;
  }
  return cleaned;
}

// Função para enviar WhatsApp via Evolution API
async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const evolutionUrl = process.env.EVOLUTION_URL || 'https://to-ligado-evolution-api.m6tens.easypanel.host';
    const evolutionKey = process.env.EVOLUTION_KEY || '5BE128D18942-4B09-8AF8-454ADEEB06B1';
    const instance = process.env.EVOLUTION_INSTANCE || 'corretinho';
    
    // Normalizar telefone
    const formattedPhone = normalizeWhatsApp(phone);
    
    console.log(`📱 Enviando WhatsApp para ${formattedPhone}...`);
    
    const response = await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey
      },
      body: JSON.stringify({
        number: formattedPhone,
        textMessage: { text: message }
      })
    });
    
    if (response.ok) {
      console.log(`✅ WhatsApp enviado para ${formattedPhone}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro ao enviar WhatsApp (${response.status}):`, errorText);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
  }
}

// Routes (abbreviated for brevity - same logic as SQLite version but with pool.execute)
app.post("/api/public/register", async (req, res) => {
  const { name, slug, owner_whatsapp, password } = req.body;
  
  // Normalizar WhatsApp para formato internacional
  const normalizedWhatsapp = normalizeWhatsApp(owner_whatsapp);
  
  try {
    const [result] = await pool.execute("INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id) VALUES (?, ?, ?, ?, ?)", [name, slug, normalizedWhatsapp, password, 1]);
    
    // TODO: Enviar WhatsApp quando tiver instância dedicada do MaisQueCardapio
    // const welcomeMessage = `🎉 *Bem-vindo ao MaisQueCardapio!*
// 
// Seu cardápio digital foi criado com sucesso!
// 
// 📋 *Seus dados de acesso:*
// 
// 🌐 *URL do Cardápio:*
// maisquecardapio.to-ligado.com/e/${slug}
// 
// 📱 *WhatsApp:* ${normalizedWhatsapp}
// 🔑 *Senha:* ${password}
// 
// ---
// 💡 *Dica:* Salve esta mensagem!
// 
// Acesse seu painel para configurar produtos, categorias e muito mais!
// 
// _Equipe MaisQueCardapio | To-Ligado.com_`;
    // sendWhatsAppMessage(normalizedWhatsapp, welcomeMessage);
    
    res.json({ id: (result as any).insertId, slug, whatsapp: normalizedWhatsapp });
  } catch (e) { res.status(400).json({ error: "Slug em uso" }); }
});

// Login com WhatsApp + senha ou X-Establishment-Slug + senha
app.post("/api/public/login", async (req, res) => {
  const { whatsapp, password } = req.body;
  const slugHeader = req.headers["x-establishment-slug"] as string;
  
  try {
    let query: string;
    let params: any[];
    
    if (slugHeader) {
      // Login por slug (header)
      query = "SELECT slug, password FROM establishments WHERE slug = ?";
      params = [slugHeader];
    } else if (whatsapp) {
      // Login por whatsapp (body) - tenta com e sem normalização
      const normalized = normalizeWhatsApp(whatsapp);
      // Tenta buscar com número normalizado
      query = "SELECT slug, password, owner_whatsapp FROM establishments WHERE owner_whatsapp IN (?, ?, ?)";
      params = [normalized, whatsapp.replace(/\D/g, ''), whatsapp];
    } else {
      return res.status(400).json({ error: "Informe whatsapp no body ou X-Establishment-Slug no header" });
    }
    
    const [rows] = await pool.execute(query, params);
    const est = (rows as any)[0];
    
    if (!est) {
      return res.status(401).json({ error: slugHeader ? "Slug não encontrado" : "WhatsApp não cadastrado" });
    }
    if (est.password !== password) {
      return res.status(401).json({ error: "Senha incorreta" });
    }
    res.json({ slug: est.slug, message: "Login realizado com sucesso" });
  } catch (e) {
    console.error("Erro no login:", e);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

app.get("/api/public/establishments/:slug", async (req, res) => {
  const [rows] = await pool.execute("SELECT id, name, slug, status FROM establishments WHERE slug = ?", [req.params.slug]);
  if (!(rows as any)[0]) return res.status(404).json({ error: "Não encontrado" });
  res.json((rows as any)[0]);
});

app.get("/api/superadmin/establishments", async (req, res) => {
  try {
    // LEFT JOIN para funcionar mesmo sem plano
    const [rows] = await pool.execute("SELECT e.*, p.name as plan_name FROM establishments e LEFT JOIN plans p ON e.plan_id = p.id ORDER BY e.created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar estabelecimentos:", error);
    res.status(500).json({ error: "Erro ao buscar estabelecimentos" });
  }
});

app.get("/api/superadmin/plans", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM plans");
    // Converter price para número
    const plans = (rows as any[]).map(p => ({
      ...p,
      price: parseFloat(p.price) || 0
    }));
    res.json(plans);
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    res.status(500).json({ error: "Erro ao buscar planos" });
  }
});

// ============================================
// SUPERADMIN - GERENCIAR PLANOS
// ============================================

app.post("/api/superadmin/plans", async (req, res) => {
  try {
    const { name, price, max_products, enable_ai, enable_reservations, enable_automation } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation) VALUES (?, ?, ?, ?, ?, ?)",
      [name, price, max_products || 0, enable_ai || false, enable_reservations || false, enable_automation || false]
    );
    res.json({ id: (result as any).insertId, success: true });
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    res.status(500).json({ error: "Erro ao criar plano" });
  }
});

app.put("/api/superadmin/plans/:id", async (req, res) => {
  try {
    const { name, price, max_products, enable_ai, enable_reservations, enable_automation } = req.body;
    await pool.execute(
      "UPDATE plans SET name = ?, price = ?, max_products = ?, enable_ai = ?, enable_reservations = ?, enable_automation = ? WHERE id = ?",
      [name, price, max_products, enable_ai, enable_reservations, enable_automation, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    res.status(500).json({ error: "Erro ao atualizar plano" });
  }
});

app.delete("/api/superadmin/plans/:id", async (req, res) => {
  try {
    // Verificar se há estabelecimentos usando este plano
    const [ests] = await pool.execute("SELECT COUNT(*) as count FROM establishments WHERE plan_id = ?", [req.params.id]);
    if ((ests as any)[0].count > 0) {
      return res.status(400).json({ error: "Não é possível excluir plano em uso por estabelecimentos" });
    }
    await pool.execute("DELETE FROM plans WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir plano:", error);
    res.status(500).json({ error: "Erro ao excluir plano" });
  }
});

// ============================================
// SUPERADMIN - GERENCIAR ESTABELECIMENTOS
// ============================================

app.put("/api/superadmin/establishments/:id", async (req, res) => {
  try {
    const { plan_id, status } = req.body;
    await pool.execute(
      "UPDATE establishments SET plan_id = ?, status = ? WHERE id = ?",
      [plan_id, status, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar estabelecimento:", error);
    res.status(500).json({ error: "Erro ao atualizar estabelecimento" });
  }
});

app.delete("/api/superadmin/establishments/:id", async (req, res) => {
  try {
    // Deletar dados relacionados primeiro
    const estId = req.params.id;
    await pool.execute("DELETE FROM products WHERE establishment_id = ?", [estId]);
    await pool.execute("DELETE FROM categories WHERE establishment_id = ?", [estId]);
    await pool.execute("DELETE FROM neighborhoods WHERE establishment_id = ?", [estId]);
    await pool.execute("DELETE FROM tables WHERE establishment_id = ?", [estId]);
    await pool.execute("DELETE FROM orders WHERE establishment_id = ?", [estId]);
    await pool.execute("DELETE FROM reservations WHERE establishment_id = ?", [estId]);
    await pool.execute("DELETE FROM settings WHERE establishment_id = ?", [estId]);
    await pool.execute("DELETE FROM establishments WHERE id = ?", [estId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir estabelecimento:", error);
    res.status(500).json({ error: "Erro ao excluir estabelecimento" });
  }
});

// Criar novo estabelecimento/usuário pelo SuperAdmin
app.post("/api/superadmin/establishments", async (req, res) => {
  try {
    const { name, slug, owner_whatsapp, password, plan_id, status } = req.body;
    
    // Validar campos obrigatórios
    if (!name || !slug || !owner_whatsapp || !password) {
      return res.status(400).json({ error: "Nome, slug, WhatsApp e senha são obrigatórios" });
    }
    
    // Verificar se slug já existe
    const [existing] = await pool.execute("SELECT id FROM establishments WHERE slug = ?", [slug]);
    if ((existing as any).length > 0) {
      return res.status(400).json({ error: "Slug já está em uso" });
    }
    
    const [result] = await pool.execute(
      "INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      [name, slug, owner_whatsapp, password, plan_id || 1, status || 'active']
    );
    res.json({ id: (result as any).insertId, success: true });
  } catch (error) {
    console.error("Erro ao criar estabelecimento:", error);
    res.status(500).json({ error: "Erro ao criar estabelecimento" });
  }
});

app.use("/api/e", getEstablishment);

app.get("/api/e/categories", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM categories WHERE establishment_id = ?", [req.establishment.id]);
  res.json(rows);
});

// Servir arquivos de upload estaticamente
app.use('/uploads', express.static(uploadsDir));

// Upload de imagem de produto
app.post("/api/e/upload/product", upload.single('image'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      image_url: imageUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao fazer upload" });
  }
});

// Upload de logomarca do estabelecimento
app.post("/api/e/upload/logo", upload.single('logo'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const logoUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      logo_url: logoUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao fazer upload" });
  }
});

app.get("/api/e/products", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM products WHERE establishment_id = ?", [req.establishment.id]);
  res.json(rows);
});

app.post("/api/e/products", async (req: any, res) => {
  const { category_id, name, description, price, image_url } = req.body;
  const [result] = await pool.execute("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)", [
    req.establishment.id, 
    category_id ?? null, 
    name ?? null, 
    description ?? null, 
    price ?? null, 
    image_url ?? null
  ]);
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
  const [rows] = await pool.execute(`
    SELECT o.*, n.name as neighborhood_name, n.delivery_fee as neighborhood_fee
    FROM orders o 
    LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
    WHERE o.establishment_id = ? 
    ORDER BY o.created_at DESC 
    LIMIT 100
  `, [req.establishment.id]);
  res.json(rows);
});

// Buscar pedido específico
app.get("/api/e/orders/:id", async (req: any, res) => {
  const [rows] = await pool.execute(`
    SELECT o.*, n.name as neighborhood_name, n.delivery_fee as neighborhood_fee
    FROM orders o 
    LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
    WHERE o.id = ? AND o.establishment_id = ?
  `, [req.params.id, req.establishment.id]);
  
  if (!(rows as any)[0]) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }
  
  // Buscar histórico do pedido
  const [history] = await pool.execute(`
    SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC
  `, [req.params.id]);
  
  res.json({ ...(rows as any)[0], history });
});

// Criar pedido com dados completos
app.post("/api/e/orders", async (req: any, res) => {
  try {
    const { 
      customer_name, 
      customer_phone, 
      customer_email,
      address, 
      address_number,
      address_complement,
      address_reference,
      neighborhood_id, 
      total, 
      delivery_fee,
      payment_method, 
      type, 
      items_text,
      notes
    } = req.body;
    
    // Gerar PIX Code se for pagamento PIX
    let pixCode = null;
    let pixQrcode = null;
    let pixExpiresAt = null;
    let paymentStatus = 'pending';
    
    if (payment_method === 'pix') {
      // Buscar chave PIX do estabelecimento
      const [settingsRows] = await pool.execute(
        "SELECT value FROM settings WHERE establishment_id = ? AND `key` = 'pix_key'",
        [req.establishment.id]
      );
    const pixKey = (settingsRows as any)[0]?.value || '';
    
    if (pixKey && total) {
      // Gerar BR Code (copia e cola)
      const txid = `ORDER${Date.now()}`.substring(0, 25);
      pixCode = generatePixCode(pixKey, total, `Pedido #${Date.now()}`, txid);
      pixQrcode = pixCode; // QR Code será gerado no frontend
      pixExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    }
  } else if (payment_method === 'entrega') {
    paymentStatus = 'pending_delivery';
  }
  
  const [result] = await pool.execute(`
    INSERT INTO orders (
      establishment_id, customer_name, customer_phone, customer_email,
      address, address_number, address_complement, address_reference,
      neighborhood_id, total, delivery_fee, payment_method, payment_status,
      pix_code, pix_qrcode, pix_expires_at, type, items_text, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    req.establishment.id, 
    customer_name || null, 
    customer_phone || null, 
    customer_email || null,
    address || null, 
    address_number || null, 
    address_complement || null, 
    address_reference || null,
    neighborhood_id || null, 
    total ?? 0, 
    delivery_fee ?? 0, 
    payment_method || 'dinheiro', 
    paymentStatus || 'pending',
    pixCode || null, 
    pixQrcode || null, 
    pixExpiresAt || null, 
    type || 'delivery', 
    items_text || '', 
    notes || null
  ]);
  
  const orderId = (result as any).insertId;
  
  // Registrar no histórico
  await pool.execute(`
    INSERT INTO order_history (order_id, status, notes, created_by)
    VALUES (?, 'pending', 'Pedido criado', 'customer')
  `, [orderId]);
  
  // Atualizar estatísticas do cliente se existir
  if (customer_phone) {
    await pool.execute(`
      INSERT INTO customers (establishment_id, name, phone, email, password, address, address_number, address_complement, address_reference, neighborhood_id, total_orders, total_spent, last_order_at)
      VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, ?, 1, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        email = COALESCE(VALUES(email), email),
        address = VALUES(address),
        address_number = VALUES(address_number),
        address_complement = VALUES(address_complement),
        address_reference = VALUES(address_reference),
        neighborhood_id = VALUES(neighborhood_id),
        total_orders = total_orders + 1,
        total_spent = total_spent + VALUES(total_spent),
        last_order_at = NOW()
    `, [
      req.establishment.id, 
      customer_name || null, 
      customer_phone, 
      customer_email || null, 
      address || null, 
      address_number || null, 
      address_complement || null, 
      address_reference || null, 
      neighborhood_id || null, 
      total || 0
    ]);
  }
  
  res.json({ 
    id: orderId, 
    pix_code: pixCode,
    pix_qrcode: pixQrcode,
    pix_expires_at: pixExpiresAt,
    payment_status: paymentStatus
  });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Confirmar pagamento PIX (manual pelo admin)
app.put("/api/e/orders/:id/confirm-payment", async (req: any, res) => {
  const { notes } = req.body;
  
  // Atualizar status do pedido
  await pool.execute(`
    UPDATE orders 
    SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
    WHERE id = ? AND establishment_id = ?
  `, [req.params.id, req.establishment.id]);
  
  // Registrar no histórico
  await pool.execute(`
    INSERT INTO order_history (order_id, status, notes, created_by)
    VALUES (?, 'paid', ?, 'admin')
  `, [req.params.id, notes || 'Pagamento PIX confirmado']);
  
  // Registrar pagamento
  await pool.execute(`
    INSERT INTO payments (order_id, establishment_id, amount, status, paid_at)
    SELECT id, establishment_id, total, 'paid', NOW()
    FROM orders WHERE id = ?
  `, [req.params.id]);
  
  // Buscar dados do pedido para notificar cliente
  const [orderRows] = await pool.execute(`
    SELECT * FROM orders WHERE id = ? AND establishment_id = ?
  `, [req.params.id, req.establishment.id]);
  
  const order = (orderRows as any)[0];
  
  if (order && order.customer_phone) {
    const message = `✅ *Pagamento Confirmado!*

📋 *Pedido #${order.id}*

Seu pagamento foi confirmado com sucesso!
Estamos preparando seu pedido.

📊 Status: Confirmado
💰 Total: R$ ${parseFloat(order.total).toFixed(2)}

Acompanhe seu pedido em nosso cardápio.

_Obrigado pela preferência!_`;
    
    await sendWhatsAppMessage(order.customer_phone, message);
  }
  
  res.json({ success: true, message: "Pagamento confirmado!" });
});

// Atualizar status do pedido
app.put("/api/e/orders/:id/status", async (req: any, res) => {
  const { status, notes } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }
  
  await pool.execute(`
    UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ? AND establishment_id = ?
  `, [status, req.params.id, req.establishment.id]);
  
  // Registrar no histórico
  await pool.execute(`
    INSERT INTO order_history (order_id, status, notes, created_by)
    VALUES (?, ?, ?, 'admin')
  `, [req.params.id, status, notes || '']);
  
  // Notificar cliente sobre mudança de status
  const [orderRows] = await pool.execute(`
    SELECT * FROM orders WHERE id = ? AND establishment_id = ?
  `, [req.params.id, req.establishment.id]);
  
  const order = (orderRows as any)[0];
  
  if (order && order.customer_phone) {
    const statusMessages: Record<string, string> = {
      'confirmed': '✅ Seu pedido foi confirmado!',
      'preparing': '👨‍🍳 Seu pedido está sendo preparado!',
      'delivering': '🛵 Seu pedido está a caminho!',
      'completed': '🎉 Pedido entregue! Obrigado!',
      'cancelled': '❌ Seu pedido foi cancelado.'
    };
    
    const message = `${statusMessages[status] || `📊 Status atualizado: ${status}`}

📋 *Pedido #${order.id}*
💰 Total: R$ ${parseFloat(order.total).toFixed(2)}

${notes || ''}`;
    
    await sendWhatsAppMessage(order.customer_phone, message);
  }
  
  res.json({ success: true });
});

// Histórico de pedidos do cliente (público)
app.get("/api/public/orders/:phone", async (req, res) => {
  const { phone } = req.params;
  const slug = req.headers['x-establishment-slug'];
  
  if (!slug) {
    return res.status(400).json({ error: "Estabelecimento não informado" });
  }
  
  // Buscar estabelecimento
  const [estRows] = await pool.execute("SELECT id FROM establishments WHERE slug = ?", [slug]);
  if (!(estRows as any)[0]) {
    return res.status(404).json({ error: "Estabelecimento não encontrado" });
  }
  
  const estId = (estRows as any)[0].id;
  
  // Buscar pedidos do cliente
  const [rows] = await pool.execute(`
    SELECT o.*, n.name as neighborhood_name
    FROM orders o 
    LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
    WHERE o.establishment_id = ? AND o.customer_phone = ?
    ORDER BY o.created_at DESC
    LIMIT 20
  `, [estId, phone]);
  
  res.json(rows);
});

// ============================================
// SISTEMA COMPLETO DE PEDIDOS E PAGAMENTOS
// ============================================

// Endpoint público para buscar pedido por ID (para acompanhamento)
app.get("/api/public/orders/id/:id", async (req, res) => {
  const { id } = req.params;
  const slug = req.headers['x-establishment-slug'];
  
  try {
    // Buscar estabelecimento
    const [estRows] = await pool.execute("SELECT id, name FROM establishments WHERE slug = ?", [slug]);
    if (!(estRows as any)[0]) {
      return res.status(404).json({ error: "Estabelecimento não encontrado" });
    }
    
    const estId = (estRows as any)[0].id;
    const estName = (estRows as any)[0].name;
    
    // Buscar pedido
    const [orderRows] = await pool.execute(`
      SELECT o.*, n.name as neighborhood_name
      FROM orders o 
      LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
      WHERE o.id = ? AND o.establishment_id = ?
    `, [id, estId]);
    
    if (!(orderRows as any)[0]) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    
    const order = (orderRows as any)[0];
    
    // Buscar histórico de status
    const [historyRows] = await pool.execute(`
      SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC
    `, [id]);
    
    // Buscar WhatsApp do admin (cashier ou kitchen)
    const [settingsRows] = await pool.execute(
      "SELECT `key`, value FROM settings WHERE establishment_id = ? AND `key` IN ('whatsapp_cashier', 'whatsapp_kitchen')",
      [estId]
    );
    
    const settings: Record<string, string> = {};
    for (const row of settingsRows as any[]) {
      settings[row.key] = row.value;
    }
    
    res.json({ 
      ...order, 
      history: historyRows,
      establishment_name: estName,
      admin_whatsapp: settings.whatsapp_cashier || settings.whatsapp_kitchen || ''
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

// Cliente confirma que pagou PIX
app.post("/api/public/orders/:id/confirm-payment", async (req, res) => {
  const { id } = req.params;
  const slug = req.headers['x-establishment-slug'];
  
  try {
    // Buscar estabelecimento
    const [estRows] = await pool.execute("SELECT id FROM establishments WHERE slug = ?", [slug]);
    if (!(estRows as any)[0]) {
      return res.status(404).json({ error: "Estabelecimento não encontrado" });
    }
    
    const estId = (estRows as any)[0].id;
    
    // Verificar se pedido existe e está aguardando pagamento
    const [orderRows] = await pool.execute(`
      SELECT * FROM orders WHERE id = ? AND establishment_id = ?
    `, [id, estId]);
    
    if (!(orderRows as any)[0]) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    
    const order = (orderRows as any)[0];
    
    if (order.payment_status !== 'pending' && order.payment_status !== 'aguardando_pagamento') {
      return res.status(400).json({ error: "Este pedido não está aguardando pagamento" });
    }
    
    // Atualizar status
    await pool.execute(`
      UPDATE orders 
      SET payment_status = 'pagamento_em_analise', updated_at = NOW()
      WHERE id = ?
    `, [id]);
    
    // Registrar no histórico
    await pool.execute(`
      INSERT INTO order_history (order_id, status, notes, created_by)
      VALUES (?, 'pagamento_em_analise', 'Cliente confirmou pagamento PIX', 'customer')
    `, [id]);
    
    // Notificar admin via WhatsApp
    const [settingsRows] = await pool.execute(
      "SELECT value FROM settings WHERE establishment_id = ? AND `key` = 'whatsapp_cashier'",
      [estId]
    );
    const adminPhone = (settingsRows as any)[0]?.value || '';
    
    if (adminPhone) {
      const message = `💰 *Pagamento PIX Confirmado pelo Cliente!*

📋 *Pedido #${order.id}*

👤 *Cliente:* ${order.customer_name || 'N/A'}
📱 *Telefone:* ${order.customer_phone || 'N/A'}
💰 *Total:* R$ ${parseFloat(order.total).toFixed(2)}

⚠️ *Ação necessária:* Verifique o pagamento e confirme no painel admin.

_Acesse o painel para confirmar ou rejeitar o pagamento._`;
      
      await sendWhatsAppMessage(adminPhone, message);
    }
    
    res.json({ success: true, message: "Pagamento confirmado! Aguarde a verificação." });
  } catch (error) {
    console.error("Erro ao confirmar pagamento:", error);
    res.status(500).json({ error: "Erro ao confirmar pagamento" });
  }
});

// Endpoint para cliente buscar seus pedidos
app.get("/api/public/customer/:phone/orders", async (req, res) => {
  const { phone } = req.params;
  const slug = req.headers['x-establishment-slug'];
  
  try {
    // Buscar estabelecimento
    const [estRows] = await pool.execute("SELECT id FROM establishments WHERE slug = ?", [slug]);
    if (!(estRows as any)[0]) {
      return res.status(404).json({ error: "Estabelecimento não encontrado" });
    }
    
    const estId = (estRows as any)[0].id;
    
    // Buscar pedidos do cliente
    const [rows] = await pool.execute(`
      SELECT o.*, n.name as neighborhood_name,
        (SELECT COUNT(*) FROM order_history oh WHERE oh.order_id = o.id) as history_count
      FROM orders o 
      LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
      WHERE o.establishment_id = ? AND o.customer_phone = ?
      ORDER BY o.created_at DESC
      LIMIT 20
    `, [estId, phone]);
    
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar pedidos do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// Admin: Atualizar status do pedido com notificação WhatsApp
app.put("/api/e/orders/:id/status", async (req: any, res) => {
  const { id } = req.params;
  const { status, payment_status, notes } = req.body;
  
  try {
    // Status válidos para o pedido
    const validOrderStatuses = [
      'pendente', 'confirmado', 'em_preparo', 'saiu_para_entrega', 
      'entregue', 'cancelado', 'aguardando_pagamento'
    ];
    
    // Status válidos para pagamento
    const validPaymentStatuses = [
      'pendente', 'aguardando_pagamento', 'pagamento_em_analise', 
      'pago', 'pagamento_rejeitado', 'pending_delivery'
    ];
    
    // Buscar pedido atual
    const [orderRows] = await pool.execute(`
      SELECT o.*, e.slug, n.name as neighborhood_name
      FROM orders o 
      JOIN establishments e ON o.establishment_id = e.id
      LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
      WHERE o.id = ? AND o.establishment_id = ?
    `, [id, req.establishment.id]);
    
    if (!(orderRows as any)[0]) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }
    
    const order = (orderRows as any)[0];
    
    // Atualizar status do pedido se fornecido
    if (status && validOrderStatuses.includes(status)) {
      await pool.execute(`
        UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?
      `, [status, id]);
      
      await pool.execute(`
        INSERT INTO order_history (order_id, status, notes, created_by)
        VALUES (?, ?, ?, 'admin')
      `, [id, status, notes || '']);
    }
    
    // Atualizar status de pagamento se fornecido
    if (payment_status && validPaymentStatuses.includes(payment_status)) {
      await pool.execute(`
        UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?
      `, [payment_status, id]);
      
      // Se pago, registrar no histórico também
      if (payment_status === 'pago') {
        await pool.execute(`
          INSERT INTO order_history (order_id, status, notes, created_by)
          VALUES (?, 'pago', ?, 'admin')
        `, [id, notes || 'Pagamento confirmado']);
        
        // Registrar pagamento na tabela payments
        await pool.execute(`
          INSERT INTO payments (order_id, establishment_id, amount, status, paid_at)
          VALUES (?, ?, ?, 'paid', NOW())
          ON DUPLICATE KEY UPDATE status = 'paid', paid_at = NOW()
        `, [id, req.establishment.id, order.total]);
      }
    }
    
    // Enviar notificação WhatsApp para o cliente
    if (order.customer_phone) {
      const baseUrl = process.env.BASE_URL || 'https://automacao-maisquecardapio.nfeujb.easypanel.host';
      const statusLabels: Record<string, string> = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'em_preparo': 'Em Preparo',
        'saiu_para_entrega': 'Saiu para Entrega',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado',
        'aguardando_pagamento': 'Aguardando Pagamento',
        'pago': 'Pagamento Confirmado'
      };
      
      const paymentLabels: Record<string, string> = {
        'pendente': 'Pendente',
        'aguardando_pagamento': 'Aguardando PIX',
        'pagamento_em_analise': 'Pagamento em Análise',
        'pago': 'Pago',
        'pagamento_rejeitado': 'Pagamento Rejeitado',
        'pending_delivery': 'Pagamento na Entrega'
      };
      
      const statusText = status ? statusLabels[status] || status : '';
      const paymentText = payment_status ? paymentLabels[payment_status] || payment_status : '';
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      let message = `🍽️ *${req.establishment.name || 'Mais Que Cardápio'}*\n\n`;
      message += `Seu pedido *#${id}* foi atualizado!\n\n`;
      
      if (statusText) {
        message += `📦 *Status:* ${statusText}\n`;
      }
      if (paymentText) {
        message += `💳 *Pagamento:* ${paymentText}\n`;
      }
      message += `⏰ ${dateStr} às ${timeStr}\n\n`;
      message += `🔗 Acompanhe: ${baseUrl}/e/${order.slug}/pedido/${id}`;
      
      if (notes && status === 'cancelado') {
        message += `\n\n📝 *Motivo:* ${notes}`;
      }
      
      await sendWhatsAppMessage(order.customer_phone, message);
    }
    
    res.json({ success: true, message: "Status atualizado!" });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

// Admin: Buscar métricas do dashboard
app.get("/api/e/dashboard/metrics", async (req: any, res) => {
  try {
    const estId = req.establishment.id;
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Total vendido (pedidos pagos)
    const [totalSold] = await pool.execute(`
      SELECT COALESCE(SUM(total), 0) as total 
      FROM orders 
      WHERE establishment_id = ? AND payment_status IN ('pago', 'paid')
    `, [estId]);
    
    // Pedidos do dia
    const [todayOrders] = await pool.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM orders 
      WHERE establishment_id = ? AND DATE(created_at) = ?
    `, [estId, today]);
    
    // Ticket médio
    const [avgTicket] = await pool.execute(`
      SELECT COALESCE(AVG(total), 0) as avg 
      FROM orders 
      WHERE establishment_id = ? AND payment_status IN ('pago', 'paid')
    `, [estId]);
    
    // Pedidos por status
    const [statusCounts] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      WHERE establishment_id = ? 
      GROUP BY status
    `, [estId]);
    
    // Pedidos do mês
    const [monthOrders] = await pool.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM orders 
      WHERE establishment_id = ? AND DATE(created_at) >= ?
    `, [estId, startOfMonth]);
    
    res.json({
      totalSold: parseFloat((totalSold as any)[0]?.total || 0),
      todayOrders: (todayOrders as any)[0]?.count || 0,
      todayTotal: parseFloat((todayOrders as any)[0]?.total || 0),
      avgTicket: parseFloat((avgTicket as any)[0]?.avg || 0),
      statusCounts: statusCounts,
      monthOrders: (monthOrders as any)[0]?.count || 0,
      monthTotal: parseFloat((monthOrders as any)[0]?.total || 0)
    });
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    res.status(500).json({ error: "Erro ao buscar métricas" });
  }
});

// Admin: Buscar pedidos com filtros
app.get("/api/e/orders", async (req: any, res) => {
  try {
    const { status, payment_status, date_from, date_to, search, limit = 100 } = req.query;
    
    let query = `
      SELECT o.*, n.name as neighborhood_name
      FROM orders o 
      LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
      WHERE o.establishment_id = ?
    `;
    const params: any[] = [req.establishment.id];
    
    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }
    
    if (payment_status) {
      query += ` AND o.payment_status = ?`;
      params.push(payment_status);
    }
    
    if (date_from) {
      query += ` AND DATE(o.created_at) >= ?`;
      params.push(date_from);
    }
    
    if (date_to) {
      query += ` AND DATE(o.created_at) <= ?`;
      params.push(date_to);
    }
    
    if (search) {
      query += ` AND (o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.id = ?)`;
      params.push(`%${search}%`, `%${search}%`, parseInt(search) || 0);
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// Função para gerar código PIX (BR Code)
function generatePixCode(pixKey: string, amount: number, merchantName: string, txid: string): string {
  // Formato simplificado do BR Code
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };
  
  // Dados do PIX
  const payloadFormat = formatField('00', '01');
  const merchantAccount = formatField('26', 
    formatField('00', 'BR.GOV.BCB.PIX') +
    formatField('01', pixKey)
  );
  const merchantCategory = formatField('52', '0000');
  const currency = formatField('53', '986');
  const amountField = formatField('54', amount.toFixed(2));
  const countryCode = formatField('58', 'BR');
  const merchantNameField = formatField('59', merchantName.substring(0, 25));
  const merchantCity = formatField('60', 'BRASILIA');
  const txidField = formatField('62', formatField('05', txid));
  
  // Montar payload sem CRC
  const payload = payloadFormat + merchantAccount + merchantCategory + currency + amountField + countryCode + merchantNameField + merchantCity + txidField + '6304';
  
  // CRC16-CCITT (simplificado - em produção usar biblioteca específica)
  const crc = calculateCRC16(payload);
  
  return payload + crc;
}

// CRC16-CCITT simplificado
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

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

// ============================================
// INTEGRAÇÃO COM SITE PRINCIPAL (To-Ligado.com)
// ============================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://automacao-evolution-api.nfeujb.easypanel.host';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '5BE128D18942-4B09-8AF8-454ADEEB06B1';
// Gerar slug único
async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = baseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  
  let counter = 0;
  let finalSlug = slug;
  
  while (true) {
    const [existing] = await pool.execute('SELECT id FROM establishments WHERE slug = ?', [finalSlug]);
    if ((existing as any[]).length === 0) break;
    counter++;
    finalSlug = `${slug}-${counter}`;
  }
  
  return finalSlug;
}

// Endpoint de sincronização - cria estabelecimento quando cliente compra no site
app.post('/api/sync/order', async (req, res) => {
  const { order, apiKey } = req.body;
  
  // Verificar API key (segurança)
  if (apiKey !== 'toligado_sync_2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const phone = order.customerWhatsapp?.replace(/\D/g, '') || '';
    const name = order.customerName || 'Meu Restaurante';
    const email = order.customerEmail || '';
    
    if (!phone) {
      return res.status(400).json({ error: 'WhatsApp/telefone é obrigatório' });
    }
    
    let establishmentId: number = 0;
    let isNew = false;
    let slug = '';
    let password = 'mudar123';
    
    // Verificar se já existe estabelecimento com esse WhatsApp
    const [existing] = await pool.execute('SELECT * FROM establishments WHERE owner_whatsapp = ?', [phone]);
    
    if ((existing as any[]).length > 0) {
      // Já existe - atualizar para Premium se necessário
      const est = (existing as any[])[0];
      establishmentId = est.id;
      slug = est.slug;
      
      // Se o pedido é de assinatura, upgrade para Premium
      if (order.price && order.price >= 49) {
        await pool.execute(
          'UPDATE establishments SET plan_id = 2, status = ? WHERE id = ?',
          ['active', establishmentId]
        );
      }
    } else {
      // Criar novo estabelecimento
      isNew = true;
      slug = await generateUniqueSlug(name);
      
      // Determinar plano baseado no valor do pedido
      const planId = order.price && order.price >= 49 ? 2 : 1; // 2 = Premium, 1 = Gratuito
      
      const [result] = await pool.execute(
        `INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id, status) 
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [name, slug, phone, password, planId]
      );
      
      establishmentId = (result as any).insertId;
      
      // Criar configurações padrão
      const defaultSettings = [
        [establishmentId, 'store_name', name],
        [establishmentId, 'pix_key', ''],
        [establishmentId, 'whatsapp_kitchen', phone],
        [establishmentId, 'whatsapp_cashier', phone],
        [establishmentId, 'primary_color', '#f97316'],
        [establishmentId, 'is_open', '1'],
      ];
      
      for (const [estId, key, value] of defaultSettings) {
        await pool.execute(
          'INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?)',
          [estId, key, value]
        );
      }
      
      // Criar categoria padrão
      await pool.execute(
        'INSERT INTO categories (establishment_id, name) VALUES (?, ?)',
        [establishmentId, 'Lanches']
      );
      
      // Criar bairro padrão
      await pool.execute(
        'INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)',
        [establishmentId, 'Centro', 5.00]
      );
      
      // Criar mesas padrão (5 mesas)
      for (let i = 1; i <= 5; i++) {
        await pool.execute(
          'INSERT INTO tables (establishment_id, number) VALUES (?, ?)',
          [establishmentId, i]
        );
      }
    }
    
    // Enviar notificação WhatsApp para o cliente
    const accessUrl = `${BASE_URL}/e/${slug}`;
    const planName = order.price && order.price >= 49 ? 'Premium' : 'Gratuito';
    
    const welcomeMessage = `🍽️ *Bem-vindo ao Mais Que Cardápio!*

Olá ${name}! Seu cardápio digital está pronto! 🚀

📋 *Plano:* ${planName}
🔗 *Acesse:* ${accessUrl}
🔐 *Slug:* ${slug}
🔑 *Senha:* ${password}

---

📱 *Gerencie seu cardápio:*
1️⃣ Acesse o link acima
2️⃣ Clique na engrenagem (⚙️) no canto superior
3️⃣ Configure produtos, categorias e taxas de entrega

---

💡 *Funcionalidades:*
✅ Cardápio digital online
✅ Pedidos via WhatsApp
✅ Gestão de mesas
✅ Sistema de reservas
✅ Delivery com taxas por bairro

${planName === 'Premium' ? '⭐ *Premium:* IA para insights, até 100 produtos!' : '💡 Faça upgrade para Premium e tenha até 100 produtos + IA!'}

_Equipe To-Ligado.com_`;
    
    const whatsappSent = await sendWhatsAppMessage(phone, welcomeMessage);
    
    // Notificar admin sobre nova venda
    const adminMessage = `🍽️ *Nova Venda - Mais Que Cardápio!*

👤 *Cliente:* ${name}
📱 *WhatsApp:* ${phone}
💵 *Valor:* R$ ${order.price?.toFixed(2) || '0,00'}
📋 *Plano:* ${planName}
🔗 *Slug:* ${slug}

${isNew ? '🆕 Novo estabelecimento criado!' : '♻️ Estabelecimento existente atualizado'}`;
    
    await sendWhatsAppMessage('5591980124904', adminMessage);
    
    console.log(`✅ Sync order: Estabelecimento ${establishmentId} - ${name} (${phone}) - Novo: ${isNew}`);
    
    res.json({
      success: true,
      establishmentId,
      isNew,
      url: accessUrl,
      slug,
      login: phone,
      password,
      plan: planName,
      whatsappSent
    });
  } catch (error) {
    console.error('Erro no sync/order:', error);
    res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

// Webhook para pagamentos/renovações
app.post('/api/webhook/payment', async (req, res) => {
  const { establishment_id, amount, status, payment_id, months } = req.body;
  
  console.log('💰 Webhook pagamento:', { establishment_id, amount, status });
  
  try {
    if (status === 'approved' || status === 'paid') {
      // Upgrade para Premium
      await pool.execute(
        'UPDATE establishments SET plan_id = 2, status = ? WHERE id = ?',
        ['active', establishment_id]
      );
      
      // Buscar dados do estabelecimento
      const [rows] = await pool.execute('SELECT * FROM establishments WHERE id = ?', [establishment_id]);
      const est = (rows as any[])[0];
      
      if (est) {
        const message = `🎉 *Pagamento Confirmado!*

🍽️ *Mais Que Cardápio*

📋 Seu plano foi atualizado para **Premium**!

✅ Até 100 produtos
✅ IA para insights
✅ Sistema de reservas
✅ Suporte prioritário

🔗 Acesse: ${BASE_URL}/e/${est.slug}

Obrigado pela confiança!

_Equipe To-Ligado.com_`;
        
        await sendWhatsAppMessage(est.owner_whatsapp, message);
      }
      
      res.json({ success: true, message: 'Pagamento processado!' });
    } else {
      res.json({ success: true, message: 'Pagamento pendente' });
    }
  } catch (error) {
    console.error('Erro no webhook de pagamento:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
});

// Endpoint para verificar status da assinatura
app.get('/api/e/subscription', async (req: any, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, p.name as plan_name, p.max_products, p.enable_ai, p.enable_reservations 
       FROM establishments e 
       JOIN plans p ON e.plan_id = p.id 
       WHERE e.id = ?`,
      [req.establishment.id]
    );
    
    const est = (rows as any[])[0];
    
    res.json({
      plan: est.plan_name,
      status: est.status,
      maxProducts: est.max_products,
      features: {
        ai: est.enable_ai === 1,
        reservations: est.enable_reservations === 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
});

// Endpoint para upgrade de plano
app.post('/api/e/upgrade', async (req: any, res) => {
  try {
    const { planId } = req.body;
    
    await pool.execute(
      'UPDATE establishments SET plan_id = ? WHERE id = ?',
      [planId, req.establishment.id]
    );
    
    res.json({ success: true, message: 'Plano atualizado!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

// ============================================
// SISTEMA DE LEMBRETES E RENOVAÇÃO
// ============================================

// Verificar assinaturas expirando e enviar lembretes
async function checkExpiringSubscriptions() {
  try {
    // Buscar estabelecimentos Premium expirando em 7 dias
    const [expiring7days] = await pool.execute(`
      SELECT e.*, p.name as plan_name 
      FROM establishments e 
      JOIN plans p ON e.plan_id = p.id
      WHERE e.plan_id = 2 
      AND e.paid_until IS NOT NULL 
      AND e.paid_until = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      AND e.status = 'active'
    `);
    
    for (const est of expiring7days as any[]) {
      // Verificar se já enviou lembrete nos últimos 3 dias
      const [recentReminder] = await pool.execute(`
        SELECT id FROM reminders_sent 
        WHERE establishment_id = ? AND type = 'expiring_7d' 
        AND sent_at > DATE_SUB(NOW(), INTERVAL 3 DAY)
      `, [est.id]);
      
      if ((recentReminder as any[]).length === 0) {
        const message = `⏰ *Lembrete: Sua assinatura expira em 7 dias!*

🍽️ *Mais Que Cardápio*

Olá! Sua assinatura Premium expira em *7 dias*.

Para manter seus benefícios:
✅ Até 100 produtos
✅ IA para insights
✅ Sistema de reservas

💰 *Renove agora:* R$ 49,90/mês
🔗 ${BASE_URL}/upgrade

Dúvidas? Responda esta mensagem!

_Equipe To-Ligado.com_`;
        
        await sendWhatsAppMessage(est.owner_whatsapp, message);
        
        // Registrar lembrete enviado
        await pool.execute(
          'INSERT INTO reminders_sent (establishment_id, type) VALUES (?, ?)',
          [est.id, 'expiring_7d']
        );
        
        console.log(`📢 Lembrete 7 dias enviado para ${est.name}`);
      }
    }
    
    // Buscar estabelecimentos Premium expirando em 3 dias
    const [expiring3days] = await pool.execute(`
      SELECT e.*, p.name as plan_name 
      FROM establishments e 
      JOIN plans p ON e.plan_id = p.id
      WHERE e.plan_id = 2 
      AND e.paid_until IS NOT NULL 
      AND e.paid_until = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      AND e.status = 'active'
    `);
    
    for (const est of expiring3days as any[]) {
      const [recentReminder] = await pool.execute(`
        SELECT id FROM reminders_sent 
        WHERE establishment_id = ? AND type = 'expiring_3d' 
        AND sent_at > DATE_SUB(NOW(), INTERVAL 2 DAY)
      `, [est.id]);
      
      if ((recentReminder as any[]).length === 0) {
        const message = `🚨 *URGENTE: Sua assinatura expira em 3 dias!*

🍽️ *Mais Que Cardápio*

Olá! Sua assinatura Premium expira em *3 dias*!

⚠️ Após a expiração, você voltará para o plano Gratuito (apenas 10 produtos).

💰 *Renove agora:* R$ 49,90/mês
🔗 ${BASE_URL}/upgrade

Não perca seus benefícios!

_Equipe To-Ligado.com_`;
        
        await sendWhatsAppMessage(est.owner_whatsapp, message);
        await pool.execute('INSERT INTO reminders_sent (establishment_id, type) VALUES (?, ?)', [est.id, 'expiring_3d']);
        console.log(`📢 Lembrete 3 dias enviado para ${est.name}`);
      }
    }
    
    // Buscar estabelecimentos expirados
    const [expired] = await pool.execute(`
      SELECT e.*, p.name as plan_name 
      FROM establishments e 
      JOIN plans p ON e.plan_id = p.id
      WHERE e.plan_id = 2 
      AND e.paid_until IS NOT NULL 
      AND e.paid_until < CURDATE()
      AND e.status = 'active'
    `);
    
    for (const est of expired as any[]) {
      // Rebaixar para Gratuito
      await pool.execute('UPDATE establishments SET plan_id = 1 WHERE id = ?', [est.id]);
      
      const message = `⚠️ *Assinatura Expirada*

🍽️ *Mais Que Cardápio*

Olá! Sua assinatura Premium expirou.

Seu plano foi alterado para **Gratuito**:
- Limite: 10 produtos
- Sem IA
- Sem reservas

Para recuperar seus benefícios:
💰 *Renove:* R$ 49,90/mês
🔗 ${BASE_URL}/upgrade

_Equipe To-Ligado.com_`;
      
      await sendWhatsAppMessage(est.owner_whatsapp, message);
      
      // Notificar admin
      await sendWhatsAppMessage('5591980124904', `⚠️ *Assinatura Expirada*\n\n🍽️ ${est.name}\n📱 ${est.owner_whatsapp}\n\nRebaixado para Gratuito.`);
      
      console.log(`📉 Estabelecimento ${est.name} rebaixado para Gratuito`);
    }
    
    return { 
      expiring7days: (expiring7days as any[]).length,
      expiring3days: (expiring3days as any[]).length,
      expired: (expired as any[]).length
    };
  } catch (error) {
    console.error('Erro ao verificar assinaturas:', error);
    return { error: String(error) };
  }
}

// Endpoint para executar verificação (cron)
app.post('/api/cron/check-subscriptions', async (req, res) => {
  const result = await checkExpiringSubscriptions();
  res.json({ success: true, ...result });
});

// Endpoint para renovar assinatura
app.post('/api/e/renew', async (req: any, res) => {
  try {
    const { months, paymentId } = req.body;
    const monthsToAdd = months || 1;
    
    // Atualizar para Premium e adicionar tempo
    await pool.execute(`
      UPDATE establishments 
      SET plan_id = 2, 
          status = 'active',
          paid_until = COALESCE(DATE_ADD(paid_until, INTERVAL ? MONTH), DATE_ADD(CURDATE(), INTERVAL ? MONTH)),
          last_payment_at = NOW()
      WHERE id = ?
    `, [monthsToAdd, monthsToAdd, req.establishment.id]);
    
    const [rows] = await pool.execute('SELECT * FROM establishments WHERE id = ?', [req.establishment.id]);
    const est = (rows as any[])[0];
    
    const message = `✅ *Assinatura Renovada!*

🍽️ *Mais Que Cardápio*

Sua assinatura foi renovada com sucesso!

📋 *Plano:* Premium
📅 *Válido até:* ${est.paid_until ? new Date(est.paid_until).toLocaleDateString('pt-BR') : 'N/A'}

✅ Até 100 produtos
✅ IA para insights
✅ Sistema de reservas
✅ Suporte prioritário

🔗 ${BASE_URL}/e/${est.slug}

Obrigado pela confiança!

_Equipe To-Ligado.com_`;
    
    await sendWhatsAppMessage(est.owner_whatsapp, message);
    
    res.json({ success: true, paidUntil: est.paid_until });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao renovar assinatura' });
  }
});

// ============================================
// SISTEMA DE MENSALIDADES COM PIX
// ============================================

// Endpoint para gerar PIX de mensalidade
app.post('/api/e/subscription/generate-pix', async (req: any, res) => {
  try {
    const { plan_id, months = 1 } = req.body;
    
    // Buscar plano
    const [planRows] = await pool.execute('SELECT * FROM plans WHERE id = ?', [plan_id || 2]);
    const plan = (planRows as any[])[0];
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }
    
    const amount = parseFloat(plan.price) * months;
    
    // Buscar chave PIX do estabelecimento (ou usar chave padrão do sistema)
    const [settingsRows] = await pool.execute(
      "SELECT value FROM settings WHERE establishment_id = ? AND `key` = 'pix_key'",
      [req.establishment.id]
    );
    const pixKey = (settingsRows as any[])[0]?.value || process.env.DEFAULT_PIX_KEY || '11999999999';
    
    // Gerar código PIX
    const txid = `SUB${req.establishment.id}${Date.now()}`.substring(0, 25);
    const pixCode = generatePixCode(pixKey, amount, `Mensalidade ${plan.name}`, txid);
    
    // Criar registro de pagamento na tabela payments (order_id NULL para assinatura)
    const [result] = await pool.execute(`
      INSERT INTO payments (order_id, establishment_id, amount, pix_code, pix_qrcode, status, created_at)
      VALUES (NULL, ?, ?, ?, ?, 'pending', NOW())
    `, [req.establishment.id, amount, pixCode, pixCode]);
    
    const paymentId = (result as any).insertId;
    
    res.json({
      success: true,
      payment_id: paymentId,
      pix_code: pixCode,
      pix_qrcode: pixCode,
      amount: amount,
      plan_name: plan.name,
      months: months
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
});

// Endpoint para buscar status da assinatura
app.get('/api/e/subscription/status', async (req: any, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.*, p.name as plan_name, p.price as plan_price, p.max_products, p.enable_ai, p.enable_reservations 
      FROM establishments e 
      JOIN plans p ON e.plan_id = p.id 
      WHERE e.id = ?
    `, [req.establishment.id]);
    
    const est = (rows as any[])[0];
    
    // Buscar pagamentos pendentes
    const [pendingPayments] = await pool.execute(`
      SELECT * FROM payments 
      WHERE establishment_id = ? AND status = 'pending' 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [req.establishment.id]);
    
    res.json({
      plan: {
        id: est.plan_id,
        name: est.plan_name,
        price: parseFloat(est.plan_price) || 0,
        maxProducts: est.max_products,
        features: {
          ai: est.enable_ai === 1,
          reservations: est.enable_reservations === 1
        }
      },
      status: est.status,
      paid_until: est.paid_until,
      trial_ends_at: est.trial_ends_at,
      last_payment_at: est.last_payment_at,
      pending_payment: (pendingPayments as any[])[0] || null
    });
  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar status da assinatura' });
  }
});

// Endpoint público para cadastro com pagamento
app.post('/api/public/register-with-payment', async (req, res) => {
  const { name, slug, owner_whatsapp, password, plan_id = 1 } = req.body;
  
  try {
    // Verificar se slug já existe
    const [existing] = await pool.execute('SELECT id FROM establishments WHERE slug = ?', [slug]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'Slug já está em uso' });
    }
    
    // Buscar plano
    const [planRows] = await pool.execute('SELECT * FROM plans WHERE id = ?', [plan_id]);
    const plan = (planRows as any[])[0];
    
    if (!plan) {
      return res.status(400).json({ error: 'Plano não encontrado' });
    }
    
    // Criar estabelecimento
    const status = plan_id === 1 ? 'active' : 'pending_payment'; // Gratuito ativo, Premium aguarda pagamento
    const [result] = await pool.execute(
      'INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, slug, owner_whatsapp, password, plan_id, status]
    );
    
    const establishmentId = (result as any).insertId;
    
    // Criar configurações padrão
    const defaultSettings = [
      [establishmentId, 'store_name', name],
      [establishmentId, 'pix_key', ''],
      [establishmentId, 'whatsapp_kitchen', owner_whatsapp],
      [establishmentId, 'whatsapp_cashier', owner_whatsapp],
      [establishmentId, 'primary_color', '#f97316'],
      [establishmentId, 'is_open', '1'],
    ];
    
    for (const [estId, key, value] of defaultSettings) {
      await pool.execute(
        'INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?)',
        [estId, key, value]
      );
    }
    
    // Criar categoria padrão
    await pool.execute(
      'INSERT INTO categories (establishment_id, name) VALUES (?, ?)',
      [establishmentId, 'Lanches']
    );
    
    // Criar bairro padrão
    await pool.execute(
      'INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)',
      [establishmentId, 'Centro', 5.00]
    );
    
    // Criar mesas padrão (5 mesas)
    for (let i = 1; i <= 5; i++) {
      await pool.execute(
        'INSERT INTO tables (establishment_id, number) VALUES (?, ?)',
        [establishmentId, i]
      );
    }
    
    // Se for Premium, gerar PIX
    let paymentInfo = null;
    if (plan_id !== 1 && parseFloat(plan.price) > 0) {
      const amount = parseFloat(plan.price);
      const pixKey = process.env.DEFAULT_PIX_KEY || '11999999999';
      const txid = `NEW${establishmentId}${Date.now()}`.substring(0, 25);
      const pixCode = generatePixCode(pixKey, amount, `Mensalidade ${plan.name}`, txid);
      
      // Criar registro de pagamento (order_id NULL para assinatura)
      const [paymentResult] = await pool.execute(`
        INSERT INTO payments (order_id, establishment_id, amount, pix_code, pix_qrcode, status, created_at)
        VALUES (NULL, ?, ?, ?, ?, 'pending', NOW())
      `, [establishmentId, amount, pixCode, pixCode]);
      
      paymentInfo = {
        payment_id: (paymentResult as any).insertId,
        pix_code: pixCode,
        pix_qrcode: pixCode,
        amount: amount,
        plan_name: plan.name
      };
    }
    
    res.json({
      success: true,
      establishment_id: establishmentId,
      slug: slug,
      status: status,
      payment: paymentInfo,
      message: status === 'pending_payment' 
        ? 'Cadastro realizado! Pague a mensalidade para ativar seu cardápio.' 
        : 'Cadastro realizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ error: 'Erro ao realizar cadastro' });
  }
});

// ============================================
// SUPERADMIN - GERENCIAR PAGAMENTOS
// ============================================

// Listar pagamentos (com filtros)
app.get('/api/superadmin/payments', async (req: any, res) => {
  try {
    const { status, establishment_id, limit = 50 } = req.query;
    
    let query = `
      SELECT p.*, e.name as establishment_name, e.slug as establishment_slug, e.owner_whatsapp,
             pl.name as plan_name
      FROM payments p 
      JOIN establishments e ON p.establishment_id = e.id
      LEFT JOIN plans pl ON e.plan_id = pl.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    
    if (establishment_id) {
      query += ` AND p.establishment_id = ?`;
      params.push(establishment_id);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT ?`;
    params.push(parseInt(String(limit)) || 50);
    
    const [rows] = await pool.execute(query, params);
    
    // Formatar valores
    const payments = (rows as any[]).map(p => ({
      ...p,
      amount: parseFloat(p.amount) || 0,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
      paid_at: p.paid_at ? new Date(p.paid_at).toISOString() : null
    }));
    
    res.json(payments);
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
});

// Confirmar pagamento (ativa estabelecimento e envia WhatsApp)
app.post('/api/superadmin/payments/:id/confirm', async (req: any, res) => {
  try {
    const paymentId = req.params.id;
    const adminId = req.user?.username || 'superadmin';
    
    // Buscar pagamento
    const [paymentRows] = await pool.execute(`
      SELECT p.*, e.owner_whatsapp, e.slug, e.name as establishment_name, pl.name as plan_name
      FROM payments p
      JOIN establishments e ON p.establishment_id = e.id
      LEFT JOIN plans pl ON e.plan_id = pl.id
      WHERE p.id = ?
    `, [paymentId]);
    
    const payment = (paymentRows as any[])[0];
    
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    
    if (payment.status === 'paid' || payment.status === 'confirmed') {
      return res.status(400).json({ error: 'Pagamento já foi confirmado' });
    }
    
    // Atualizar status do pagamento
    await pool.execute(`
      UPDATE payments 
      SET status = 'confirmed', paid_at = NOW(), confirmed_by = ?
      WHERE id = ?
    `, [adminId, paymentId]);
    
    // Ativar/estender estabelecimento
    await pool.execute(`
      UPDATE establishments 
      SET status = 'active', 
          plan_id = 2,
          paid_until = COALESCE(DATE_ADD(paid_until, INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 1 MONTH)),
          last_payment_at = NOW()
      WHERE id = ?
    `, [payment.establishment_id]);
    
    // Enviar WhatsApp para o cliente
    const message = `✅ *Pagamento Confirmado!*

🍽️ *Mais Que Cardápio*

Olá! Seu pagamento de *R$ ${parseFloat(payment.amount).toFixed(2)}* foi confirmado com sucesso!

📋 *Plano:* ${payment.plan_name || 'Premium'}
📅 *Válido até:* ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}

Seu cardápio está ativo! 🎉

🔗 Acesse: ${BASE_URL}/e/${payment.slug}

Obrigado pela confiança!

_Equipe To-Ligado.com_`;
    
    await sendWhatsAppMessage(payment.owner_whatsapp, message);
    
    // Notificar admin sobre confirmação
    await sendWhatsAppMessage('5591980124904', `✅ *Pagamento Confirmado*\n\n💳 ID: #${paymentId}\n🏪 ${payment.establishment_name}\n💰 R$ ${parseFloat(payment.amount).toFixed(2)}\n📱 ${payment.owner_whatsapp}`);
    
    res.json({ 
      success: true, 
      message: 'Pagamento confirmado e cliente notificado via WhatsApp!' 
    });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: 'Erro ao confirmar pagamento' });
  }
});

// Rejeitar pagamento
app.post('/api/superadmin/payments/:id/reject', async (req: any, res) => {
  try {
    const paymentId = req.params.id;
    const { reason } = req.body;
    
    // Buscar pagamento
    const [paymentRows] = await pool.execute(`
      SELECT p.*, e.owner_whatsapp, e.slug, e.name as establishment_name
      FROM payments p
      JOIN establishments e ON p.establishment_id = e.id
      WHERE p.id = ?
    `, [paymentId]);
    
    const payment = (paymentRows as any[])[0];
    
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    
    // Atualizar status do pagamento
    await pool.execute(`
      UPDATE payments 
      SET status = 'rejected', notes = ?
      WHERE id = ?
    `, [reason || 'Pagamento rejeitado', paymentId]);
    
    // Notificar cliente
    const message = `❌ *Pagamento Rejeitado*

🍽️ *Mais Que Cardápio*

Olá! Infelizmente não foi possível confirmar seu pagamento.

${reason ? `*Motivo:* ${reason}` : ''}

Por favor, entre em contato para regularizar.

🔗 ${BASE_URL}/e/${payment.slug}/admin/assinatura

_Equipe To-Ligado.com_`;
    
    await sendWhatsAppMessage(payment.owner_whatsapp, message);
    
    res.json({ 
      success: true, 
      message: 'Pagamento rejeitado e cliente notificado.' 
    });
  } catch (error) {
    console.error('Erro ao rejeitar pagamento:', error);
    res.status(500).json({ error: 'Erro ao rejeitar pagamento' });
  }
});

// Buscar detalhes de um pagamento específico
app.get('/api/superadmin/payments/:id', async (req: any, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, e.name as establishment_name, e.slug as establishment_slug, 
             e.owner_whatsapp, e.status as establishment_status,
             pl.name as plan_name
      FROM payments p
      JOIN establishments e ON p.establishment_id = e.id
      LEFT JOIN plans pl ON e.plan_id = pl.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    const payment = (rows as any[])[0];
    
    if (!payment) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }
    
    res.json({
      ...payment,
      amount: parseFloat(payment.amount) || 0
    });
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamento' });
  }
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
