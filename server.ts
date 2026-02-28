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

// ============================================
// INTEGRAÇÃO COM SITE PRINCIPAL (To-Ligado.com)
// ============================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://automacao-evolution-api.nfeujb.easypanel.host';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '5BE128D18942-4B09-8AF8-454ADEEB06B1';
const TOLIGADO_INSTANCE = 'toligado';
const BASE_URL = process.env.BASE_URL || 'https://automacao-maisquecardapio.nfeujb.easypanel.host';

// Enviar mensagem WhatsApp via Evolution API
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${TOLIGADO_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: to,
        options: { delay: 1000, presence: 'composing' },
        textMessage: { text: message }
      })
    });
    
    if (response.ok) {
      console.log(`✅ WhatsApp enviado para ${to}`);
      return true;
    } else {
      console.error(`❌ Erro ao enviar WhatsApp:`, await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    return false;
  }
}

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
