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
import { createMockPool } from "./mockPool.ts";

dotenv.config();

const normalizeBaseUrl = (raw?: string | null): string => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
};

const isLocalHostUrl = (url: string): boolean => {
  if (!url) return true;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local')
    );
  } catch {
    return true;
  }
};

const CONFIGURED_BASE_URL = normalizeBaseUrl(
  process.env.BASE_URL || process.env.APP_URL || process.env.PUBLIC_URL
);
let lastObservedPublicBaseUrl =
  CONFIGURED_BASE_URL && !isLocalHostUrl(CONFIGURED_BASE_URL) ? CONFIGURED_BASE_URL : '';

function extractRequestBaseUrl(req?: any): string {
  if (!req) return '';

  // 1. Prefer reverse-proxy headers (EasyPanel / Traefik / Nginx / Cloud Run)
  const rawForwardedHost = String(req.headers?.['x-forwarded-host'] || '').split(',')[0].trim();
  const rawHost = rawForwardedHost || String(req.headers?.host || req.get?.('host') || '').split(',')[0].trim();
  const rawProtoHeader = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();

  // Strict hostname[:port] validation to prevent host header injection
  const safeHost = /^[a-zA-Z0-9.-]+(:\d{1,5})?$/.test(rawHost) ? rawHost : '';
  if (safeHost) {
    const proto =
      rawProtoHeader === 'https' || rawProtoHeader === 'http'
        ? rawProtoHeader
        : req.secure
          ? 'https'
          : isLocalHostUrl(`http://${safeHost}`)
            ? 'http'
            : 'https';
    const candidate = normalizeBaseUrl(`${proto}://${safeHost}`);
    if (candidate) {
      if (!isLocalHostUrl(candidate)) {
        lastObservedPublicBaseUrl = candidate;
      }
      return candidate;
    }
  }

  // 2. Fallback to browser Origin / Referer header
  const originCandidate = normalizeBaseUrl(req.headers?.origin || req.headers?.referer);
  if (originCandidate) {
    if (!isLocalHostUrl(originCandidate)) {
      lastObservedPublicBaseUrl = originCandidate;
    }
    return originCandidate;
  }

  return '';
}

function getPublicBaseUrl(req?: any): string {
  if (CONFIGURED_BASE_URL && !isLocalHostUrl(CONFIGURED_BASE_URL)) {
    return CONFIGURED_BASE_URL;
  }
  const fromReq = extractRequestBaseUrl(req);
  if (fromReq && !isLocalHostUrl(fromReq)) {
    return fromReq;
  }
  if (lastObservedPublicBaseUrl) {
    return lastObservedPublicBaseUrl;
  }
  return fromReq || CONFIGURED_BASE_URL || "http://localhost:3000";
}

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

// MySQL Connection Pool (with automatic in-memory fallback when DB is unavailable)
let pool: any = process.env.DB_HOST
  ? mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "maisquecardapio",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000,
    })
  : createMockPool();

// Initialize Database Tables
async function initDatabase() {
  try {
    if (!process.env.DB_HOST) {
      console.log("[Database] DB_HOST not configured — using in-memory mock store");
      return;
    }
    const connection = await pool.getConnection();
  
  await connection.execute(`CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    max_products INT,
    enable_ai TINYINT DEFAULT 0,
    enable_reservations TINYINT DEFAULT 0,
    enable_automation TINYINT DEFAULT 1,
    enable_tables TINYINT DEFAULT 0
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

  // Tabela de pagamentos PIX / InfinitePay
  await connection.execute(`CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NULL,
    establishment_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'pix',
    external_id VARCHAR(255) NULL,
    checkout_url TEXT NULL,
    notes TEXT NULL,
    pix_code TEXT,
    pix_qrcode TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    paid_at DATETIME NULL,
    confirmed_by VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (establishment_id) REFERENCES establishments(id)
  )`);

  // Tabela de configurações globais da plataforma (SuperAdmin)
  await connection.execute(`CREATE TABLE IF NOT EXISTS platform_settings (
    \`key\` VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Corrige tabela existente para permitir order_id NULL (pagamentos de assinatura) e colunas novas
  try {
    await connection.execute(`ALTER TABLE payments MODIFY COLUMN order_id INT NULL`);
  } catch (e: any) {
    if (!e.message.includes('Unknown column')) console.log('payments já permite NULL');
  }
  for (const colSql of [
    `ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) DEFAULT 'pix'`,
    `ALTER TABLE payments ADD COLUMN external_id VARCHAR(255) NULL`,
    `ALTER TABLE payments ADD COLUMN checkout_url TEXT NULL`,
    `ALTER TABLE payments ADD COLUMN notes TEXT NULL`
  ]) {
    try {
      await connection.execute(colSql);
    } catch (e: any) {
      // Ignore duplicate column error
    }
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
    bill_requested_at DATETIME NULL,
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
  
  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM plans LIKE 'enable_tables'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE plans ADD COLUMN enable_tables TINYINT DEFAULT 0`);
      await connection.execute(`UPDATE plans SET enable_tables = 1 WHERE price > 0 OR id = 2`);
      await connection.execute(`UPDATE plans SET enable_tables = 0 WHERE price = 0 AND id = 1`);
      console.log('✅ Coluna enable_tables adicionada em plans');
    }
  } catch (e) { console.log('Erro enable_tables:', e); }

  try {
    await connection.execute(`UPDATE plans SET enable_automation = 1 WHERE id = 1 AND price = 0`);
  } catch (e) { console.log('Erro sync enable_automation:', e); }

  try {
    const [cols] = await connection.execute(`SHOW COLUMNS FROM commands LIKE 'bill_requested_at'`);
    if ((cols as any[]).length === 0) {
      await connection.execute(`ALTER TABLE commands ADD COLUMN bill_requested_at DATETIME NULL`);
      console.log('✅ Coluna bill_requested_at adicionada em commands');
    }
  } catch (e) { console.log('Erro bill_requested_at:', e); }

  console.log('✅ Migration concluída!');

  // Seed demo data if empty
  const [plans] = await connection.execute("SELECT COUNT(*) as count FROM plans");
  if ((plans as any)[0].count === 0) {
    await connection.execute("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation, enable_tables) VALUES (?, ?, ?, ?, ?, ?, ?)", ["Gratuito", 0, 10, 0, 0, 1, 0]);
    await connection.execute("INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation, enable_tables) VALUES (?, ?, ?, ?, ?, ?, ?)", ["Premium", 49.90, 100, 1, 1, 1, 1]);
    await connection.execute("INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id) VALUES (?, ?, ?, ?, ?)", ["MaisQueCardapio Demo", "demo", "5511999999999", "admin123", 2]);
    
    const [est] = await connection.execute("SELECT id FROM establishments WHERE slug = ?", ["demo"]);
    const estId = (est as any)[0].id;

    const settings = [
      [estId, "pix_key", "11999999999"],
      [estId, "whatsapp_kitchen", "5511999999999"],
      [estId, "whatsapp_cashier", "5511999999999"],
      [estId, "store_name", "MaisQueCardapio Demo"],
      [estId, "primary_color", "#f97316"],
      [estId, "catalog_theme", "light"],
      [estId, "catalog_banner", "/assets/demo/banner-demo.jpg"],
      [estId, "is_open", "1"],
    ];
    for (const s of settings) await connection.execute("INSERT INTO settings (establishment_id, \`key\`, value) VALUES (?, ?, ?)", s);
    
    const [catBurgers] = await connection.execute("INSERT INTO categories (establishment_id, name) VALUES (?, ?)", [estId, "Hambúrgueres"]);
    const [catDrinks] = await connection.execute("INSERT INTO categories (establishment_id, name) VALUES (?, ?)", [estId, "Bebidas"]);
    const burgersId = (catBurgers as any).insertId;
    const drinksId = (catDrinks as any).insertId;
    await connection.execute("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)", [estId, burgersId, "X-Burger Clássico", "Pão, carne 150g, queijo e maionese da casa.", 25.90, "/assets/demo/x-burger.jpg"]);
    await connection.execute("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)", [estId, burgersId, "X-Bacon Especial", "Pão brioche, blend 180g, cheddar e bacon crocante.", 32.90, "/assets/demo/x-bacon.jpg"]);
    await connection.execute("INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)", [estId, drinksId, "Refrigerante Lata", "350ml bem gelado.", 7.00, "/assets/demo/refrigerante.jpg"]);
    await connection.execute("INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)", [estId, "Centro", 5.00]);
    for (let i = 1; i <= 5; i++) await connection.execute("INSERT INTO tables (establishment_id, number) VALUES (?, ?)", [estId, i]);
    
    console.log("Demo data seeded");
  }

  // Sincronizar nome, capa e imagens da loja demo em bancos já existentes (sem sobrescrever uploads personalizados)
  try {
    const [demoRows] = await connection.execute("SELECT id, name FROM establishments WHERE slug = ?", ["demo"]);
    const demoEst = (demoRows as any[])[0];
    if (demoEst) {
      const demoId = demoEst.id;
      await connection.execute(
        "INSERT INTO settings (establishment_id, `key`, value) VALUES (?, 'store_name', ?) ON DUPLICATE KEY UPDATE value = IF(value IS NULL OR TRIM(value) = '', VALUES(value), value)",
        [demoId, demoEst.name || "MaisQueCardapio Demo"]
      );

      const [bannerRows] = await connection.execute(
        "SELECT value FROM settings WHERE establishment_id = ? AND `key` = 'catalog_banner'",
        [demoId]
      );
      const currentBanner = String((bannerRows as any[])[0]?.value || "").trim();
      if (!currentBanner || (!currentBanner.startsWith("/uploads/") && !currentBanner.startsWith("/assets/demo/"))) {
        await connection.execute(
          "INSERT INTO settings (establishment_id, `key`, value) VALUES (?, 'catalog_banner', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
          [demoId, "/assets/demo/banner-demo.jpg"]
        );
      }

      const [catRows] = await connection.execute("SELECT id, name FROM categories WHERE establishment_id = ?", [demoId]);
      let burgersCatId = (catRows as any[]).find((c) => /hamb|lanche|burger/i.test(c.name))?.id || (catRows as any[])[0]?.id || null;
      let drinksCatId = (catRows as any[]).find((c) => /bebid|drink/i.test(c.name))?.id || burgersCatId;
      if (!burgersCatId) {
        const [insCat] = await connection.execute("INSERT INTO categories (establishment_id, name) VALUES (?, ?)", [demoId, "Hambúrgueres"]);
        burgersCatId = (insCat as any).insertId;
      }
      if (!drinksCatId || drinksCatId === burgersCatId) {
        const existingBebidas = (catRows as any[]).find((c) => /bebid/i.test(c.name));
        if (existingBebidas) {
          drinksCatId = existingBebidas.id;
        } else {
          const [insDrink] = await connection.execute("INSERT INTO categories (establishment_id, name) VALUES (?, ?)", [demoId, "Bebidas"]);
          drinksCatId = (insDrink as any).insertId;
        }
      }

      const [allDemoProducts] = await connection.execute(
        "SELECT p.id, p.name, p.image_url, p.category_id, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.establishment_id = ? ORDER BY p.id ASC",
        [demoId]
      );
      const demoProductsList = allDemoProducts as any[];
      const existingCount = demoProductsList.length;

      let updatedDemoImages = 0;
      let fallbackIdx = 0;
      const fallbackCycle = ["/assets/demo/x-burger.jpg", "/assets/demo/x-bacon.jpg", "/assets/demo/refrigerante.jpg"];

      for (const p of demoProductsList) {
        const curImg = String(p.image_url || "").trim();
        if (curImg.startsWith("/uploads/") || curImg.startsWith("/assets/demo/")) {
          continue;
        }

        const pName = String(p.name || "");
        const cName = String(p.category_name || "");
        let targetImg = "";

        if (/bacon|smash|duplo|cheddar|tudo|especial|artesanal/i.test(pName)) {
          targetImg = "/assets/demo/x-bacon.jpg";
        } else if (/refrigerante|coca|guaran|suco|bebida|lata|agua|água|cerveja/i.test(pName) || /bebid|drink/i.test(cName)) {
          targetImg = "/assets/demo/refrigerante.jpg";
        } else if (/burger|burguer|lanche|x-|sandu/i.test(pName) || /hamb|lanche|burger/i.test(cName)) {
          targetImg = "/assets/demo/x-burger.jpg";
        } else {
          targetImg = fallbackCycle[fallbackIdx % fallbackCycle.length];
          fallbackIdx++;
        }

        await connection.execute("UPDATE products SET image_url = ? WHERE id = ? AND establishment_id = ?", [targetImg, p.id, demoId]);
        updatedDemoImages++;
      }

      const demoDefaults: Array<[string, string, number, string, number | null]> = [
        ["X-Burger Clássico", "Pão, carne 150g, queijo e maionese da casa.", 25.90, "/assets/demo/x-burger.jpg", burgersCatId],
        ["X-Bacon Especial", "Pão brioche, blend 180g, cheddar e bacon crocante.", 32.90, "/assets/demo/x-bacon.jpg", burgersCatId],
        ["Refrigerante Lata", "350ml bem gelado.", 7.00, "/assets/demo/refrigerante.jpg", drinksCatId],
      ];
      if (existingCount < 3) {
        for (const [prodName, prodDesc, prodPrice, imgPath, catId] of demoDefaults) {
          const alreadyExists = demoProductsList.some(
            (p) => String(p.name || "").trim().toLowerCase() === prodName.toLowerCase()
          );
          if (!alreadyExists) {
            await connection.execute(
              "INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)",
              [demoId, catId, prodName, prodDesc, prodPrice, imgPath]
            );
          }
        }
      }
      console.log(`✅ Loja demo sincronizada com capa e imagens locais (${updatedDemoImages} produtos atualizados)`);
    }
  } catch (e) {
    console.log("Erro ao sincronizar loja demo:", e);
  }

  connection.release();
  console.log("Database initialized");
  } catch (error) {
    console.warn("[Database] MySQL not connected — falling back to in-memory mock store:", (error as any)?.message || error);
    pool = createMockPool();
  }
}

await initDatabase();

const app = express();
app.set("trust proxy", true);
app.use(express.json());
app.use((req, _res, next) => {
  extractRequestBaseUrl(req);
  next();
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "superadmin-jwt-secret-change-in-production";
const SUPERADMIN_USER = (process.env.SUPERADMIN_USER || "").trim() || "superadmin";
const SUPERADMIN_PASSWORD = (process.env.SUPERADMIN_PASSWORD || "").trim() || "admin123";

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
  
  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  if (cleanUser === SUPERADMIN_USER && cleanPass === SUPERADMIN_PASSWORD) {
    const token = jwt.sign(
      { role: "superadmin", username: cleanUser },
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

async function getEstablishmentPlanFeatures(establishment: any) {
  const planId = establishment?.plan_id || 1;
  const [rows] = await pool.execute("SELECT * FROM plans WHERE id = ?", [planId]);
  const plan = (rows as any[])[0];
  const isPaidOrPremium = plan ? (parseFloat(plan.price) > 0 || Number(plan.id) !== 1) : Number(planId) !== 1;
  return {
    plan,
    isPremium: isPaidOrPremium,
    maxProducts: Number(plan?.max_products) || (isPaidOrPremium ? 100 : 10),
    enableAi: plan ? Number(plan.enable_ai) === 1 : isPaidOrPremium,
    enableReservations: plan ? Number(plan.enable_reservations) === 1 : isPaidOrPremium,
    enableAutomation: plan ? Number(plan.enable_automation ?? 1) === 1 : true,
    enableTables: plan?.enable_tables !== undefined ? Number(plan.enable_tables) === 1 : isPaidOrPremium,
  };
}

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

// Helpers de Configurações da Plataforma & Evolution API v2
async function getPlatformSettings(): Promise<Record<string, string>> {
  try {
    const [rows] = await pool.execute("SELECT `key`, value FROM platform_settings");
    const obj: Record<string, string> = {};
    for (const r of rows as any[]) {
      obj[r.key] = r.value ?? "";
    }
    return obj;
  } catch {
    return {};
  }
}

async function setPlatformSetting(key: string, value: string) {
  await pool.execute(
    "INSERT INTO platform_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
    [key, value, value]
  );
}

async function getEstablishmentSettings(establishmentId: number): Promise<Record<string, string>> {
  try {
    const [rows] = await pool.execute("SELECT `key`, value FROM settings WHERE establishment_id = ?", [establishmentId]);
    const obj: Record<string, string> = {};
    for (const r of rows as any[]) {
      obj[r.key] = r.value ?? "";
    }
    return obj;
  } catch {
    return {};
  }
}

async function evolutionRequest(apiUrl: string, apiKey: string, endpoint: string, method = "GET", body?: any) {
  const base = apiUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function connectOrCreateEvolutionInstance(apiUrl: string, apiKey: string, instanceName: string) {
  // 1. Verificar estado atual
  const stateRes = await evolutionRequest(apiUrl, apiKey, `/instance/connectionState/${encodeURIComponent(instanceName)}`);
  const currentState = stateRes.data?.instance?.state || stateRes.data?.state;
  if (stateRes.ok && currentState === "open") {
    return { connected: true, state: "open", instance: instanceName, qrcode_base64: null, code: null, pairing_code: null };
  }

  // 2. Tentar conectar instância existente
  const connectRes = await evolutionRequest(apiUrl, apiKey, `/instance/connect/${encodeURIComponent(instanceName)}`);
  if (connectRes.ok && (connectRes.data?.base64 || connectRes.data?.code || connectRes.data?.pairingCode || connectRes.data?.instance)) {
    const st = connectRes.data?.instance?.state || connectRes.data?.state || "connecting";
    return {
      connected: st === "open",
      state: st,
      instance: instanceName,
      qrcode_base64: connectRes.data?.base64 || connectRes.data?.qrcode?.base64 || null,
      code: connectRes.data?.code || connectRes.data?.qrcode?.code || null,
      pairing_code: connectRes.data?.pairingCode || connectRes.data?.qrcode?.pairingCode || null,
    };
  }

  // 3. Criar nova instância caso não exista
  const createRes = await evolutionRequest(apiUrl, apiKey, `/instance/create`, "POST", {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  });

  if (!createRes.ok) {
    throw new Error(createRes.data?.message || createRes.data?.error || `Erro na Evolution API (${createRes.status})`);
  }

  return {
    connected: false,
    state: "connecting",
    instance: instanceName,
    qrcode_base64: createRes.data?.qrcode?.base64 || createRes.data?.base64 || null,
    code: createRes.data?.qrcode?.code || createRes.data?.code || null,
    pairing_code: createRes.data?.qrcode?.pairingCode || createRes.data?.pairingCode || null,
  };
}

// Função para enviar WhatsApp via Evolution API (suporta instância global/SuperAdmin ou específica da loja)
async function sendWhatsAppMessage(
  phone: string,
  message: string,
  options?: { apiUrl?: string; apiKey?: string; instance?: string; useSuperAdmin?: boolean }
) {
  try {
    const ps = await getPlatformSettings();
    const evolutionUrl = options?.apiUrl || ps.evolution_global_url || process.env.EVOLUTION_URL || process.env.EVOLUTION_API_URL || '';
    const evolutionKey = options?.apiKey || ps.evolution_global_key || process.env.EVOLUTION_KEY || process.env.EVOLUTION_API_KEY || '';
    const instance = options?.instance || (options?.useSuperAdmin ? ps.superadmin_evolution_instance : '') || ps.superadmin_evolution_instance || process.env.EVOLUTION_INSTANCE || '';

    if (!evolutionUrl || !evolutionKey || !instance || !phone) {
      return false;
    }

    const formattedPhone = normalizeWhatsApp(phone);
    console.log(`📱 Enviando WhatsApp (${instance}) para ${formattedPhone}...`);

    const base = evolutionUrl.replace(/\/+$/, "");
    const response = await fetch(`${base}/message/sendText/${encodeURIComponent(instance)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
        textMessage: { text: message }
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      console.log(`✅ WhatsApp enviado para ${formattedPhone}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro ao enviar WhatsApp (${response.status}):`, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    return false;
  }
}

async function sendEstablishmentWhatsApp(establishmentId: number, phone: string, message: string) {
  const es = await getEstablishmentSettings(establishmentId);
  if (es.evolution_enabled !== '1' || !es.evolution_instance) {
    return false;
  }
  return sendWhatsAppMessage(phone, message, {
    apiUrl: es.evolution_api_url || undefined,
    apiKey: es.evolution_api_key || undefined,
    instance: es.evolution_instance,
  });
}

async function notifySuperAdmin(type: 'signup' | 'payment' | 'renewal', message: string) {
  const ps = await getPlatformSettings();
  if (!ps.superadmin_notify_whatsapp) return false;
  if (type === 'signup' && ps.superadmin_notify_new_signup === '0') return false;
  if (type === 'payment' && ps.superadmin_notify_payment === '0') return false;
  if (type === 'renewal' && ps.superadmin_notify_renewal === '0') return false;
  return sendWhatsAppMessage(ps.superadmin_notify_whatsapp, message, { useSuperAdmin: true });
}

// Routes
app.post("/api/public/register", async (req, res) => {
  const { name, slug, owner_whatsapp, password } = req.body;
  const normalizedWhatsapp = normalizeWhatsApp(owner_whatsapp);

  try {
    const [result] = await pool.execute(
      "INSERT INTO establishments (name, slug, owner_whatsapp, password, plan_id) VALUES (?, ?, ?, ?, ?)",
      [name, slug, normalizedWhatsapp, password, 1]
    );
    const estId = (result as any).insertId;

    const defaults = [
      [estId, "store_name", name],
      [estId, "whatsapp_kitchen", normalizedWhatsapp],
      [estId, "whatsapp_cashier", normalizedWhatsapp],
      [estId, "primary_color", "#f97316"],
      [estId, "is_open", "1"],
    ];
    for (const [id, k, v] of defaults) {
      await pool.execute("INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?)", [id, k, v]);
    }

    // Criar categorias iniciais para que o lojista já consiga cadastrar produtos imediatamente
    for (const catName of ["Lanches", "Bebidas", "Porções"]) {
      await pool.execute("INSERT INTO categories (establishment_id, name) VALUES (?, ?)", [estId, catName]);
    }

    // Criar bairro inicial padrão para delivery
    await pool.execute(
      "INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)",
      [estId, "Centro", 5.0]
    );

    const publicUrl = getPublicBaseUrl(req);
    const welcomeMessage = `🎉 *Bem-vindo ao MaisQueCardapio!*\n\nSeu cardápio digital foi criado com sucesso!\n\n🌐 *Seu Cardápio:* ${publicUrl}/e/${slug}\n⚙️ *Painel Admin:* ${publicUrl}/e/${slug}/admin\n📱 *WhatsApp:* ${normalizedWhatsapp}\n\nAcesse seu painel para configurar produtos, categorias e conectar seu WhatsApp via QR Code!`;
    await sendWhatsAppMessage(normalizedWhatsapp, welcomeMessage, { useSuperAdmin: true });

    await notifySuperAdmin(
      'signup',
      `🆕 *Nova Contratação / Cadastro*\n\n🏪 *Loja:* ${name}\n🌐 *Link:* ${publicUrl}/e/${slug}\n📱 *WhatsApp:* ${normalizedWhatsapp}\n📋 *Plano:* Gratuito`
    );

    res.json({ id: estId, slug, whatsapp: normalizedWhatsapp });
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
  const [rows] = await pool.execute("SELECT id, name, slug, status, plan_id FROM establishments WHERE slug = ?", [req.params.slug]);
  const est = (rows as any)[0];
  if (!est) return res.status(404).json({ error: "Não encontrado" });
  const features = await getEstablishmentPlanFeatures(est);
  res.json({
    id: est.id,
    name: est.name,
    slug: est.slug,
    status: est.status,
    plan_id: est.plan_id,
    enable_tables: features.enableTables ? 1 : 0,
    enable_automation: features.enableAutomation ? 1 : 0,
    enable_reservations: features.enableReservations ? 1 : 0,
  });
});

app.get("/api/public/plans", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM plans");
    const plans = (rows as any[])
      .map((p) => {
        const isPaidOrPremium = parseFloat(p.price) > 0 || Number(p.id) !== 1;
        return {
          id: p.id,
          name: p.name,
          price: parseFloat(p.price) || 0,
          max_products: Number(p.max_products) || 0,
          enable_reservations: Number(p.enable_reservations) === 1 ? 1 : 0,
          enable_automation: Number(p.enable_automation ?? 1) === 1 ? 1 : 0,
          enable_tables: Number(p.enable_tables ?? (isPaidOrPremium ? 1 : 0)) === 1 ? 1 : 0,
        };
      })
      .sort((a, b) => a.price - b.price);
    res.json(plans);
  } catch (error) {
    console.error("Erro ao buscar planos públicos:", error);
    res.status(500).json({ error: "Erro ao buscar planos" });
  }
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
    const { name, price, max_products, enable_ai, enable_reservations, enable_automation, enable_tables } = req.body;
    const isPaid = parseFloat(price) > 0;
    const [result] = await pool.execute(
      "INSERT INTO plans (name, price, max_products, enable_ai, enable_reservations, enable_automation, enable_tables) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        price,
        max_products || 0,
        enable_ai ? 1 : 0,
        enable_reservations ? 1 : 0,
        enable_automation !== undefined ? (enable_automation ? 1 : 0) : 1,
        enable_tables !== undefined ? (enable_tables ? 1 : 0) : (isPaid ? 1 : 0)
      ]
    );
    res.json({ id: (result as any).insertId, success: true });
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    res.status(500).json({ error: "Erro ao criar plano" });
  }
});

app.put("/api/superadmin/plans/:id", async (req, res) => {
  try {
    const { name, price, max_products, enable_ai, enable_reservations, enable_automation, enable_tables } = req.body;
    const isPaid = parseFloat(price) > 0 || Number(req.params.id) !== 1;
    await pool.execute(
      "UPDATE plans SET name = ?, price = ?, max_products = ?, enable_ai = ?, enable_reservations = ?, enable_automation = ?, enable_tables = ? WHERE id = ?",
      [
        name,
        price,
        max_products,
        enable_ai ? 1 : 0,
        enable_reservations ? 1 : 0,
        enable_automation !== undefined ? (enable_automation ? 1 : 0) : 1,
        enable_tables !== undefined ? (enable_tables ? 1 : 0) : (isPaid ? 1 : 0),
        req.params.id
      ]
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
    await pool.execute("DELETE FROM customers WHERE establishment_id = ?", [estId]);
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
    const estId = (result as any).insertId;
    const defaultSettings = [
      [estId, "store_name", name],
      [estId, "whatsapp_kitchen", owner_whatsapp],
      [estId, "whatsapp_cashier", owner_whatsapp],
      [estId, "primary_color", "#f97316"],
      [estId, "is_open", "1"],
    ];
    for (const [id, k, v] of defaultSettings) {
      await pool.execute("INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?)", [id, k, v]);
    }
    for (const catName of ["Lanches", "Bebidas", "Porções"]) {
      await pool.execute("INSERT INTO categories (establishment_id, name) VALUES (?, ?)", [estId, catName]);
    }
    await pool.execute("INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)", [estId, "Centro", 5.0]);

    res.json({ id: estId, success: true });
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

// Upload de capa / banner do estabelecimento
app.post("/api/e/upload/banner", upload.single('banner'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const bannerUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      banner_url: bannerUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao fazer upload da capa" });
  }
});

app.post("/api/e/categories", async (req: any, res) => {
  try {
    const cleanName = String(req.body?.name || "").trim();
    if (!cleanName) {
      return res.status(400).json({ error: "Informe o nome da categoria." });
    }
    const [result] = await pool.execute(
      "INSERT INTO categories (establishment_id, name) VALUES (?, ?)",
      [req.establishment.id, cleanName]
    );
    res.json({ id: (result as any).insertId, name: cleanName });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ error: "Erro ao criar categoria." });
  }
});

app.put("/api/e/categories/:id", async (req: any, res) => {
  try {
    const cleanName = String(req.body?.name || "").trim();
    if (!cleanName) {
      return res.status(400).json({ error: "Informe o nome da categoria." });
    }
    await pool.execute(
      "UPDATE categories SET name = ? WHERE id = ? AND establishment_id = ?",
      [cleanName, req.params.id, req.establishment.id]
    );
    res.json({ success: true, id: Number(req.params.id), name: cleanName });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ error: "Erro ao atualizar categoria." });
  }
});

app.delete("/api/e/categories/:id", async (req: any, res) => {
  try {
    await pool.execute(
      "UPDATE products SET category_id = NULL WHERE category_id = ? AND establishment_id = ?",
      [req.params.id, req.establishment.id]
    );
    await pool.execute(
      "DELETE FROM categories WHERE id = ? AND establishment_id = ?",
      [req.params.id, req.establishment.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    res.status(500).json({ error: "Erro ao remover categoria." });
  }
});

app.get("/api/e/products", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM products WHERE establishment_id = ?", [req.establishment.id]);
  res.json(rows);
});

app.post("/api/e/products", async (req: any, res) => {
  try {
    const { category_id, name, description, price, image_url } = req.body;
    const cleanName = String(name || "").trim();
    const numericPrice = typeof price === "number" ? price : parseFloat(String(price ?? "").replace(",", "."));

    if (!cleanName) {
      return res.status(400).json({ error: "Informe o nome do produto." });
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: "Informe um preço válido para o produto." });
    }

    // Verificar limite de produtos do plano
    const [planRows] = await pool.execute("SELECT max_products, name FROM plans WHERE id = ?", [req.establishment.plan_id || 1]);
    const plan = (planRows as any[])[0];
    if (plan && Number(plan.max_products) > 0) {
      const [countRows] = await pool.execute(
        "SELECT COUNT(*) as count FROM products WHERE establishment_id = ?",
        [req.establishment.id]
      );
      const currentCount = Number((countRows as any[])[0]?.count || 0);
      if (currentCount >= Number(plan.max_products)) {
        return res.status(403).json({
          error: `Seu plano ${plan.name} permite até ${plan.max_products} produtos. Faça upgrade para o Plano Premium na aba Assinatura para cadastrar mais itens.`
        });
      }
    }

    const parsedCategoryId = category_id !== undefined && category_id !== null && String(category_id).trim() !== ""
      ? parseInt(String(category_id), 10)
      : null;
    const safeCategoryId = parsedCategoryId && Number.isFinite(parsedCategoryId) ? parsedCategoryId : null;

    const [result] = await pool.execute(
      "INSERT INTO products (establishment_id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.establishment.id,
        safeCategoryId,
        cleanName,
        String(description || "").trim(),
        numericPrice,
        image_url ? String(image_url).trim() : ""
      ]
    );
    res.json({ id: (result as any).insertId });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao salvar produto. Verifique os dados e tente novamente." });
  }
});

app.put("/api/e/products/:id", async (req: any, res) => {
  try {
    const { category_id, name, description, price, image_url, is_available } = req.body;
    const cleanName = String(name || "").trim();
    const numericPrice = typeof price === "number" ? price : parseFloat(String(price ?? "").replace(",", "."));
    if (!cleanName) {
      return res.status(400).json({ error: "Informe o nome do produto." });
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: "Informe um preço válido para o produto." });
    }
    const parsedCategoryId = category_id !== undefined && category_id !== null && String(category_id).trim() !== ""
      ? parseInt(String(category_id), 10)
      : null;
    const safeCategoryId = parsedCategoryId && Number.isFinite(parsedCategoryId) ? parsedCategoryId : null;

    await pool.execute(
      "UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_available = ? WHERE id = ? AND establishment_id = ?",
      [
        safeCategoryId,
        cleanName,
        String(description || "").trim(),
        numericPrice,
        image_url ? String(image_url).trim() : "",
        is_available ? 1 : 0,
        req.params.id,
        req.establishment.id
      ]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
});

app.delete("/api/e/products/:id", async (req: any, res) => {
  try {
    await pool.execute("DELETE FROM products WHERE id = ? AND establishment_id = ?", [req.params.id, req.establishment.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    res.status(500).json({ error: "Erro ao remover produto." });
  }
});

app.get("/api/e/neighborhoods", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM neighborhoods WHERE establishment_id = ?", [req.establishment.id]);
  res.json(rows);
});

app.post("/api/e/neighborhoods", async (req: any, res) => {
  const { name, delivery_fee } = req.body;
  const [result] = await pool.execute("INSERT INTO neighborhoods (establishment_id, name, delivery_fee) VALUES (?, ?, ?)", [req.establishment.id, name, delivery_fee]);
  res.json({ id: (result as any).insertId });
});

app.delete("/api/e/neighborhoods/:id", async (req: any, res) => {
  await pool.execute("DELETE FROM neighborhoods WHERE id = ? AND establishment_id = ?", [req.params.id, req.establishment.id]);
  res.json({ success: true });
});

app.get("/api/e/tables", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT * FROM tables WHERE establishment_id = ? ORDER BY number", [req.establishment.id]);
  res.json(rows);
});

app.post("/api/e/tables", async (req: any, res) => {
  const features = await getEstablishmentPlanFeatures(req.establishment);
  if (!features.enableTables) {
    return res.status(403).json({
      error: "Pedidos na mesa (QR Code), comandas abertas e impressão de cupom são exclusivos do Plano Premium.",
      upgradeRequired: true
    });
  }
  const { number } = req.body;
  try {
    const [result] = await pool.execute("INSERT INTO tables (establishment_id, number) VALUES (?, ?)", [req.establishment.id, number]);
    res.json({ id: (result as any).insertId });
  } catch (e) {
    res.status(400).json({ error: "Mesa já existe" });
  }
});

app.delete("/api/e/tables/:id", async (req: any, res) => {
  const features = await getEstablishmentPlanFeatures(req.establishment);
  if (!features.enableTables) {
    return res.status(403).json({
      error: "Gerenciamento de mesas (QR Code) é exclusivo do Plano Premium.",
      upgradeRequired: true
    });
  }
  await pool.execute("DELETE FROM tables WHERE id = ? AND establishment_id = ?", [req.params.id, req.establishment.id]);
  res.json({ success: true });
});

app.get("/api/e/commands", async (req: any, res) => {
  const [rows] = await pool.execute(
    "SELECT c.*, t.number as table_number FROM commands c LEFT JOIN tables t ON c.table_id = t.id WHERE c.status = 'open' AND c.establishment_id = ? ORDER BY c.created_at DESC",
    [req.establishment.id]
  );
  res.json(rows);
});

app.post("/api/e/commands", async (req: any, res) => {
  const features = await getEstablishmentPlanFeatures(req.establishment);
  if (!features.enableTables) {
    return res.status(403).json({
      error: "Comandas abertas são exclusivas do Plano Premium.",
      upgradeRequired: true
    });
  }
  const { table_id, waiter_name } = req.body;
  if (table_id) {
    const [existingRows] = await pool.execute(
      "SELECT id FROM commands WHERE establishment_id = ? AND table_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
      [req.establishment.id, table_id]
    );
    const existing = (existingRows as any[])[0];
    if (existing) {
      return res.json({ id: existing.id, alreadyOpen: true });
    }
  }
  const [result] = await pool.execute(
    "INSERT INTO commands (establishment_id, table_id, waiter_name) VALUES (?, ?, ?)",
    [req.establishment.id, table_id || null, waiter_name || 'Balcão']
  );
  res.json({ id: (result as any).insertId });
});

app.put("/api/e/commands/:id", async (req: any, res) => {
  const features = await getEstablishmentPlanFeatures(req.establishment);
  if (!features.enableTables) {
    return res.status(403).json({
      error: "Comandas abertas são exclusivas do Plano Premium.",
      upgradeRequired: true
    });
  }
  const { status, order_ids, mark_orders_paid } = req.body;
  await pool.execute("UPDATE commands SET status = ? WHERE id = ? AND establishment_id = ?", [status, req.params.id, req.establishment.id]);
  if (status === 'closed' && mark_orders_paid && Array.isArray(order_ids)) {
    for (const orderId of order_ids) {
      if (orderId) {
        await pool.execute(
          "UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE id = ? AND establishment_id = ?",
          [orderId, req.establishment.id]
        );
      }
    }
  }
  res.json({ success: true });
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

app.get("/api/e/customers", async (req: any, res) => {
  try {
    const estId = req.establishment.id;
    const [custRows] = await pool.execute(`
      SELECT c.id, c.establishment_id, c.name, c.phone, c.email,
             c.address, c.address_number, c.address_complement, c.address_reference,
             c.neighborhood_id, n.name as neighborhood_name,
             c.total_orders, c.total_spent, c.created_at, c.last_order_at
      FROM customers c
      LEFT JOIN neighborhoods n ON c.neighborhood_id = n.id
      WHERE c.establishment_id = ?
      ORDER BY COALESCE(c.last_order_at, c.created_at) DESC
    `, [estId]);

    const [orderRows] = await pool.execute(`
      SELECT o.*, n.name as neighborhood_name
      FROM orders o
      LEFT JOIN neighborhoods n ON o.neighborhood_id = n.id
      WHERE o.establishment_id = ?
      ORDER BY o.created_at DESC
      LIMIT 500
    `, [estId]);

    const normalizePhoneKey = (raw: string | null | undefined) => {
      const digits = String(raw || '').replace(/\D/g, '');
      if (!digits) return '';
      if (digits.startsWith('55') && digits.length >= 12) return digits.slice(2);
      return digits;
    };

    const customerMap = new Map<string, any>();

    for (const c of custRows as any[]) {
      const key = normalizePhoneKey(c.phone) || `id_${c.id}`;
      customerMap.set(key, {
        id: c.id,
        name: c.name || 'Cliente',
        phone: c.phone || '',
        email: c.email || null,
        address: c.address || null,
        address_number: c.address_number || null,
        address_complement: c.address_complement || null,
        address_reference: c.address_reference || null,
        neighborhood_id: c.neighborhood_id || null,
        neighborhood_name: c.neighborhood_name || null,
        stored_orders: Number(c.total_orders) || 0,
        stored_spent: parseFloat(c.total_spent) || 0,
        total_orders: 0,
        total_spent: 0,
        created_at: c.created_at,
        last_order_at: c.last_order_at || null,
        recent_orders: [] as any[],
      });
    }

    for (const o of orderRows as any[]) {
      const key = normalizePhoneKey(o.customer_phone);
      if (!key) continue;

      let entry = customerMap.get(key);
      if (!entry) {
        entry = {
          id: null,
          name: o.customer_name || 'Cliente',
          phone: o.customer_phone || '',
          email: o.customer_email || null,
          address: o.address || null,
          address_number: o.address_number || null,
          address_complement: o.address_complement || null,
          address_reference: o.address_reference || null,
          neighborhood_id: o.neighborhood_id || null,
          neighborhood_name: o.neighborhood_name || null,
          stored_orders: 0,
          stored_spent: 0,
          total_orders: 0,
          total_spent: 0,
          created_at: o.created_at,
          last_order_at: o.created_at,
          recent_orders: [] as any[],
        };
        customerMap.set(key, entry);
      }

      if (!entry.address && o.address) {
        entry.address = o.address;
        entry.address_number = o.address_number || entry.address_number;
        entry.address_complement = o.address_complement || entry.address_complement;
        entry.address_reference = o.address_reference || entry.address_reference;
        entry.neighborhood_id = o.neighborhood_id || entry.neighborhood_id;
        entry.neighborhood_name = o.neighborhood_name || entry.neighborhood_name;
      }

      const isCancelled = o.status === 'cancelled' || o.status === 'cancelado';
      if (!isCancelled) {
        entry.total_orders += 1;
        entry.total_spent += parseFloat(String(o.total)) || 0;
        if (!entry.last_order_at || new Date(o.created_at).getTime() > new Date(entry.last_order_at).getTime()) {
          entry.last_order_at = o.created_at;
        }
      }

      if (entry.recent_orders.length < 20) {
        entry.recent_orders.push({
          id: o.id,
          total: parseFloat(String(o.total)) || 0,
          status: o.status,
          payment_method: o.payment_method,
          payment_status: o.payment_status,
          type: o.type,
          items_text: o.items_text,
          created_at: o.created_at,
        });
      }
    }

    const result = Array.from(customerMap.values())
      .map((c) => {
        const ordersCount = c.recent_orders.length > 0 ? c.total_orders : c.stored_orders;
        const totalSpent = c.recent_orders.length > 0 ? c.total_spent : c.stored_spent;
        const { stored_orders, stored_spent, ...rest } = c;
        return {
          ...rest,
          total_orders: ordersCount,
          total_spent: totalSpent,
        };
      })
      .sort((a, b) => {
        const ta = new Date(a.last_order_at || a.created_at || 0).getTime();
        const tb = new Date(b.last_order_at || b.created_at || 0).getTime();
        return tb - ta;
      });

    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

app.post("/api/e/customers", async (req: any, res) => {
  try {
    const { name, phone, email, address, address_number, address_complement, address_reference, neighborhood_id } = req.body;
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();
    if (!cleanName || !cleanPhone) {
      return res.status(400).json({ error: "Nome e telefone são obrigatórios" });
    }
    const [result] = await pool.execute(
      `INSERT INTO customers (establishment_id, name, phone, email, password, address, address_number, address_complement, address_reference, neighborhood_id)
       VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, ?)`,
      [
        req.establishment.id,
        cleanName,
        cleanPhone,
        email ? String(email).trim() : null,
        address ? String(address).trim() : null,
        address_number ? String(address_number).trim() : null,
        address_complement ? String(address_complement).trim() : null,
        address_reference ? String(address_reference).trim() : null,
        neighborhood_id ? Number(neighborhood_id) : null
      ]
    );
    res.json({ id: (result as any).insertId, success: true });
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('duplicate')) {
      return res.status(400).json({ error: "Já existe um cliente cadastrado com este telefone." });
    }
    console.error("Erro ao cadastrar cliente:", error);
    res.status(500).json({ error: "Erro ao cadastrar cliente" });
  }
});

app.delete("/api/e/customers/:id", async (req: any, res) => {
  try {
    await pool.execute("DELETE FROM customers WHERE id = ? AND establishment_id = ?", [req.params.id, req.establishment.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
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

// Helper para gerar Checkout Link InfinitePay de um pedido da loja
async function createOrderInfinitePayCheckout(
  establishment: { id: number; slug: string; name?: string },
  order: { id: number; total: any },
  requestOrigin: string
) {
  const es = await getEstablishmentSettings(establishment.id);
  const handle = (es.infinitepay_handle || '').replace(/^\$/, '').trim();
  if (es.infinitepay_enabled !== '1' || !handle) {
    throw new Error('InfinitePay não está configurada para esta loja.');
  }

  const [existingRows] = await pool.execute(
    `SELECT * FROM payments WHERE order_id = ? AND payment_method = 'infinitepay' ORDER BY id DESC LIMIT 1`,
    [order.id]
  );
  const existing = (existingRows as any[])[0];
  if (existing && existing.checkout_url && existing.status === 'pending') {
    return {
      checkout_url: existing.checkout_url,
      order_nsu: existing.external_id || `ORDER-${order.id}`,
    };
  }

  const amount = parseFloat(String(order.total)) || 0;
  const priceInCents = Math.max(100, Math.round(amount * 100));
  const orderNsu = `ORDER-${order.id}`;
  const resolvedOrigin = normalizeBaseUrl(requestOrigin) || getPublicBaseUrl();
  const redirectUrl = `${resolvedOrigin}/e/${establishment.slug}/pedido/${order.id}?infinitepay=returned`;
  const webhookUrl = `${resolvedOrigin}/api/webhook/infinitepay`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (es.infinitepay_api_key) {
    headers['X-Api-Key'] = es.infinitepay_api_key;
  }

  const ipRes = await fetch('https://api.infinitepay.io/invoices/public/checkout/links', {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      handle,
      items: [
        {
          description: `${es.store_name || establishment.name || 'Pedido'} - Pedido #${order.id}`,
          price: priceInCents,
          quantity: 1,
        },
      ],
      order_nsu: orderNsu,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
    }),
  });

  const ipData: any = await ipRes.json().catch(() => ({}));
  const checkoutUrl = ipData?.url || ipData?.checkout_url || ipData?.link;

  if (!ipRes.ok || !checkoutUrl) {
    throw new Error(ipData?.message || ipData?.error || 'Falha ao gerar link InfinitePay. Verifique a InfiniteTag/API Key da loja.');
  }

  await pool.execute(
    `INSERT INTO payments (order_id, establishment_id, amount, payment_method, external_id, checkout_url, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
    [order.id, establishment.id, amount, 'infinitepay', orderNsu, checkoutUrl, `Pedido #${order.id}`]
  );

  return { checkout_url: checkoutUrl, order_nsu: orderNsu };
}

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

    if (type === 'table') {
      const features = await getEstablishmentPlanFeatures(req.establishment);
      if (!features.enableTables) {
        return res.status(403).json({
          error: 'Pedidos na mesa via QR Code são exclusivos do Plano Premium.',
          upgradeRequired: true
        });
      }
    }

    if (payment_method === 'infinitepay') {
      const esCheck = await getEstablishmentSettings(req.establishment.id);
      if (esCheck.infinitepay_enabled !== '1' || !(esCheck.infinitepay_handle || '').trim()) {
        return res.status(400).json({ error: 'InfinitePay não está configurada para esta loja.' });
      }
    }
    
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
    } else if (payment_method === 'comanda') {
      paymentStatus = 'pending_comanda';
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
  
  // Notificar cliente / loja via instância Evolution da própria loja
  const es = await getEstablishmentSettings(req.establishment.id);
  if (es.evolution_enabled === '1' && es.evolution_instance) {
    const typeLabel = type === 'table' ? 'Mesa' : type === 'pickup' ? 'Balcão / Retirada' : 'Delivery';
    const paymentLabel = payment_method === 'comanda'
      ? 'Adicionar à Comanda (pagar ao final)'
      : payment_method === 'infinitepay'
        ? 'InfinitePay'
        : (payment_method || 'N/A');
    const targetNumber = type === 'table' || type === 'pickup' ? (es.whatsapp_kitchen || es.whatsapp_cashier) : es.whatsapp_cashier;
    const orderMsg = `🛒 *Novo Pedido #${orderId}*\n\n👤 *Cliente:* ${customer_name || 'N/A'}\n📦 *Tipo:* ${typeLabel}\n\n*Itens:*\n${items_text || ''}\n\n💰 *Total:* R$ ${(parseFloat(String(total)) || 0).toFixed(2)}\n💳 *Pagamento:* ${paymentLabel}`;
    if (targetNumber) {
      await sendEstablishmentWhatsApp(req.establishment.id, targetNumber, orderMsg);
    }
  }

  let checkoutUrl: string | null = null;
  let orderNsu: string | null = null;
  let checkoutError: string | null = null;
  if (payment_method === 'infinitepay') {
    try {
      const requestOrigin = getPublicBaseUrl(req);
      const ipCheckout = await createOrderInfinitePayCheckout(
        req.establishment,
        { id: orderId, total: total ?? 0 },
        requestOrigin
      );
      checkoutUrl = ipCheckout.checkout_url;
      orderNsu = ipCheckout.order_nsu;
    } catch (ipErr: any) {
      checkoutError = ipErr?.message || 'Erro ao gerar link InfinitePay';
      console.warn('Erro ao gerar InfinitePay do pedido:', checkoutError);
    }
  }

  res.json({ 
    id: orderId, 
    pix_code: pixCode,
    pix_qrcode: pixQrcode,
    pix_expires_at: pixExpiresAt,
    payment_status: paymentStatus,
    checkout_url: checkoutUrl,
    order_nsu: orderNsu,
    checkout_error: checkoutError
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
    
    await sendEstablishmentWhatsApp(req.establishment.id, order.customer_phone, message);
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
      'delivering': order.type === 'pickup' ? '🛍️ Seu pedido está pronto para retirada no balcão!' : '🛵 Seu pedido está a caminho!',
      'completed': order.type === 'pickup' ? '🎉 Pedido retirado! Obrigado!' : '🎉 Pedido entregue! Obrigado!',
      'cancelled': '❌ Seu pedido foi cancelado.'
    };
    
    const message = `${statusMessages[status] || `📊 Status atualizado: ${status}`}

📋 *Pedido #${order.id}*
💰 Total: R$ ${parseFloat(order.total).toFixed(2)}

${notes || ''}`;
    
    await sendEstablishmentWhatsApp(req.establishment.id, order.customer_phone, message);
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

// Resumo da comanda aberta de uma mesa (público)
async function getPublicTableComandaSummary(establishmentId: number, tableNumber: number) {
  const [cmdRows] = await pool.execute(
    "SELECT c.*, t.number as table_number FROM commands c LEFT JOIN tables t ON c.table_id = t.id WHERE c.status = 'open' AND c.establishment_id = ? ORDER BY c.created_at DESC",
    [establishmentId]
  );
  const openCmd = (cmdRows as any[]).find((c) => Number(c.table_number) === tableNumber) || null;

  const [orderRows] = await pool.execute(
    "SELECT * FROM orders WHERE establishment_id = ? ORDER BY created_at DESC LIMIT 100",
    [establishmentId]
  );

  const cmdStartMs = openCmd ? new Date(openCmd.created_at).getTime() - 60000 : null;
  const todayStr = new Date().toISOString().split('T')[0];

  const matchingOrders = (orderRows as any[]).filter((o) => {
    if (o.type !== 'table' || o.customer_name !== `Mesa ${tableNumber}`) return false;
    if (o.status === 'cancelled' || o.status === 'cancelado') return false;
    if (cmdStartMs !== null) {
      return new Date(o.created_at).getTime() >= cmdStartMs;
    }
    const orderDay = new Date(o.created_at).toISOString().split('T')[0];
    return orderDay === todayStr && o.payment_status !== 'paid' && o.payment_status !== 'pago';
  });

  const total = matchingOrders.reduce((acc, o) => acc + (parseFloat(String(o.total)) || 0), 0);
  const unpaidTotal = matchingOrders
    .filter((o) => o.payment_status !== 'paid' && o.payment_status !== 'pago')
    .reduce((acc, o) => acc + (parseFloat(String(o.total)) || 0), 0);

  return {
    table_number: tableNumber,
    has_open_command: Boolean(openCmd),
    command_id: openCmd?.id || null,
    bill_requested_at: openCmd?.bill_requested_at || null,
    orders_count: matchingOrders.length,
    total,
    unpaid_total: unpaidTotal,
    orders: matchingOrders.map((o) => ({
      id: o.id,
      total: parseFloat(String(o.total)) || 0,
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      items_text: o.items_text,
      created_at: o.created_at,
    })),
  };
}

app.get("/api/public/tables/:tableNumber/summary", async (req, res) => {
  const slug = req.headers['x-establishment-slug'];
  const tableNum = parseInt(req.params.tableNumber, 10);
  if (!slug || Number.isNaN(tableNum)) {
    return res.status(400).json({ error: "Mesa ou estabelecimento inválido" });
  }
  try {
    const [estRows] = await pool.execute("SELECT * FROM establishments WHERE slug = ?", [slug]);
    const est = (estRows as any[])[0];
    if (!est) return res.status(404).json({ error: "Estabelecimento não encontrado" });

    const features = await getEstablishmentPlanFeatures(est);
    if (!features.enableTables) {
      return res.status(403).json({ error: "Comandas na mesa são exclusivas do Plano Premium.", upgradeRequired: true });
    }

    const summary = await getPublicTableComandaSummary(est.id, tableNum);
    res.json(summary);
  } catch (error) {
    console.error("Erro ao buscar resumo da mesa:", error);
    res.status(500).json({ error: "Erro ao consultar comanda da mesa" });
  }
});

// Cliente solicita fechamento da conta da mesa (avisa caixa/garçom — fechamento real fica no Admin)
app.post("/api/public/tables/:tableNumber/request-bill", async (req, res) => {
  const slug = req.headers['x-establishment-slug'];
  const tableNum = parseInt(req.params.tableNumber, 10);
  if (!slug || Number.isNaN(tableNum)) {
    return res.status(400).json({ error: "Mesa ou estabelecimento inválido" });
  }
  try {
    const [estRows] = await pool.execute("SELECT * FROM establishments WHERE slug = ?", [slug]);
    const est = (estRows as any[])[0];
    if (!est) return res.status(404).json({ error: "Estabelecimento não encontrado" });

    const features = await getEstablishmentPlanFeatures(est);
    if (!features.enableTables) {
      return res.status(403).json({ error: "Comandas na mesa são exclusivas do Plano Premium.", upgradeRequired: true });
    }

    let summary = await getPublicTableComandaSummary(est.id, tableNum);
    let commandId = summary.command_id;

    if (!commandId) {
      const [tableRows] = await pool.execute("SELECT * FROM tables WHERE establishment_id = ? ORDER BY number", [est.id]);
      const table = (tableRows as any[]).find((t) => Number(t.number) === tableNum);
      if (table) {
        const [ins] = await pool.execute(
          "INSERT INTO commands (establishment_id, table_id, waiter_name) VALUES (?, ?, ?)",
          [est.id, table.id, 'Cliente (Online)']
        );
        commandId = (ins as any).insertId;
      }
    }

    if (commandId) {
      await pool.execute(
        "UPDATE commands SET bill_requested_at = NOW() WHERE id = ? AND establishment_id = ?",
        [commandId, est.id]
      );
      summary = await getPublicTableComandaSummary(est.id, tableNum);
    }

    const es = await getEstablishmentSettings(est.id);
    const cashierPhone = es.whatsapp_cashier || es.whatsapp_kitchen;
    if (cashierPhone) {
      const msg = `🧾 *Mesa ${tableNum} pediu a conta!*\n\n📋 *Pedidos na comanda:* ${summary.orders_count}\n💰 *Total acumulado:* R$ ${summary.total.toFixed(2)}\n💳 *Em aberto:* R$ ${summary.unpaid_total.toFixed(2)}\n\n_O cliente aguarda atendimento na mesa. Acesse a aba Comandas no painel para receber e fechar a conta._`;
      await sendEstablishmentWhatsApp(est.id, cashierPhone, msg);
    }

    res.json({
      success: true,
      message: `Solicitação enviada! Um atendente irá até a Mesa ${tableNum}.`,
      ...summary,
      bill_requested_at: summary.bill_requested_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao solicitar conta da mesa:", error);
    res.status(500).json({ error: "Erro ao solicitar fechamento da conta" });
  }
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
    
    // Buscar WhatsApp do admin e configuração InfinitePay da loja
    const [settingsRows] = await pool.execute(
      "SELECT `key`, value FROM settings WHERE establishment_id = ? AND `key` IN ('whatsapp_cashier', 'whatsapp_kitchen', 'infinitepay_enabled', 'infinitepay_handle')",
      [estId]
    );
    
    const settings: Record<string, string> = {};
    for (const row of settingsRows as any[]) {
      settings[row.key] = row.value;
    }

    const [ipPayRows] = await pool.execute(
      "SELECT checkout_url, external_id, status FROM payments WHERE order_id = ? AND payment_method = 'infinitepay' ORDER BY id DESC LIMIT 1",
      [id]
    );
    const ipPay = (ipPayRows as any[])[0];
    
    res.json({ 
      ...order, 
      history: historyRows,
      establishment_name: estName,
      admin_whatsapp: settings.whatsapp_cashier || settings.whatsapp_kitchen || '',
      store_infinitepay_enabled: settings.infinitepay_enabled === '1' && Boolean((settings.infinitepay_handle || '').trim()),
      infinitepay_checkout_url: ipPay?.checkout_url || null,
      infinitepay_order_nsu: ipPay?.external_id || `ORDER-${order.id}`
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ error: "Erro ao buscar pedido" });
  }
});

// Gerar ou recuperar link de checkout InfinitePay para um pedido da loja
app.post("/api/public/orders/:id/infinitepay-checkout", async (req, res) => {
  const { id } = req.params;
  const slug = req.headers['x-establishment-slug'] as string;

  try {
    const [estRows] = await pool.execute("SELECT id, name, slug FROM establishments WHERE slug = ?", [slug]);
    const est = (estRows as any[])[0];
    if (!est) {
      return res.status(404).json({ error: "Estabelecimento não encontrado" });
    }

    const [orderRows] = await pool.execute(
      "SELECT * FROM orders WHERE id = ? AND establishment_id = ?",
      [id, est.id]
    );
    const order = (orderRows as any[])[0];
    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    if (order.payment_status === 'pago' || order.payment_status === 'paid') {
      return res.status(400).json({ error: "Este pedido já está pago." });
    }

    const requestOrigin = getPublicBaseUrl(req);
    const ipCheckout = await createOrderInfinitePayCheckout(est, order, requestOrigin);
    res.json({ success: true, ...ipCheckout });
  } catch (error: any) {
    console.error("Erro ao gerar checkout InfinitePay do pedido:", error);
    res.status(400).json({ error: error?.message || "Erro ao gerar link InfinitePay." });
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
      
      await sendEstablishmentWhatsApp(estId, adminPhone, message);
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
      const baseUrl = getPublicBaseUrl(req);
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
      
      await sendEstablishmentWhatsApp(req.establishment.id, order.customer_phone, message);
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
  obj.has_infinitepay_api_key = obj.infinitepay_api_key ? '1' : '0';
  delete obj.infinitepay_api_key;
  res.json(obj);
});

app.post("/api/e/settings", async (req: any, res) => {
  for (const [k, v] of Object.entries(req.body)) {
    if (k === 'has_infinitepay_api_key') continue;
    if (k === 'infinitepay_api_key' && !String(v || '').trim()) continue;
    const cleanVal = k === 'infinitepay_handle' ? String(v || '').replace(/^\$/, '').trim() : v;
    await pool.execute("INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?", [req.establishment.id, k, cleanVal, cleanVal]);
  }
  res.json({ success: true });
});

app.get("/api/e/reservations", async (req: any, res) => {
  const [rows] = await pool.execute("SELECT r.*, t.number as table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id WHERE r.establishment_id = ? ORDER BY r.reservation_time", [req.establishment.id]);
  res.json(rows);
});

app.post("/api/e/reservations", async (req: any, res) => {
  const { customer_name, customer_phone, table_id, reservation_time, guests } = req.body;
  const [result] = await pool.execute(
    "INSERT INTO reservations (establishment_id, customer_name, customer_phone, table_id, reservation_time, guests) VALUES (?, ?, ?, ?, ?, ?)",
    [req.establishment.id, customer_name, customer_phone, table_id || null, reservation_time, guests || 1]
  );
  res.json({ id: (result as any).insertId });
});

app.put("/api/e/reservations/:id", async (req: any, res) => {
  const { status } = req.body;
  await pool.execute("UPDATE reservations SET status = ? WHERE id = ? AND establishment_id = ?", [status, req.params.id, req.establishment.id]);
  res.json({ success: true });
});

app.delete("/api/e/reservations/:id", async (req: any, res) => {
  await pool.execute("DELETE FROM reservations WHERE id = ? AND establishment_id = ?", [req.params.id, req.establishment.id]);
  res.json({ success: true });
});

// Customer Auth Routes
app.post("/api/public/customer/register", async (req, res) => {
  const { establishment_id, name, phone, password } = req.body;
  try {
    const [result] = await pool.execute(
      "INSERT INTO customers (establishment_id, name, phone, password) VALUES (?, ?, ?, ?)",
      [establishment_id, name, phone, password]
    );
    res.json({ id: (result as any).insertId, name, phone });
  } catch (e) {
    res.status(400).json({ error: "Telefone já cadastrado nesta loja" });
  }
});

app.post("/api/public/customer/login", async (req, res) => {
  const { establishment_id, phone, password } = req.body;
  const [rows] = await pool.execute(
    "SELECT * FROM customers WHERE establishment_id = ? AND phone = ? AND password = ?",
    [establishment_id, phone, password]
  );
  const customer = (rows as any[])[0];
  if (customer) {
    res.json(customer);
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

app.get("/api/public/customer/:id/orders", async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT * FROM orders WHERE customer_phone = (SELECT phone FROM customers WHERE id = ?) ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json(rows);
});

// ============================================
// INTEGRAÇÃO COM SITE PRINCIPAL (To-Ligado.com)
// ============================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
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
  const expectedKey = process.env.SYNC_API_KEY;
  if (!expectedKey || apiKey !== expectedKey) {
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
    const publicUrl = getPublicBaseUrl(req);
    const accessUrl = `${publicUrl}/e/${slug}`;
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

🔗 Acesse: ${getPublicBaseUrl(req)}/e/${est.slug}

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
    const features = await getEstablishmentPlanFeatures(req.establishment);
    
    res.json({
      plan: features.plan?.name || 'Gratuito',
      status: req.establishment.status,
      maxProducts: features.maxProducts,
      features: {
        ai: features.enableAi,
        reservations: features.enableReservations,
        automation: features.enableAutomation,
        tables: features.enableTables
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
🔗 ${getPublicBaseUrl()}/e/${est.slug}/admin/assinatura

Dúvidas? Responda esta mensagem!

_Equipe To-Ligado.com_`;
        
        await sendWhatsAppMessage(est.owner_whatsapp, message, { useSuperAdmin: true });
        await notifySuperAdmin('renewal', `⏰ *Lembrete 7 dias enviado*\n\n🏪 ${est.name}\n📱 ${est.owner_whatsapp}`);
        
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
🔗 ${getPublicBaseUrl()}/e/${est.slug}/admin/assinatura

Não perca seus benefícios!

_Equipe To-Ligado.com_`;
        
        await sendWhatsAppMessage(est.owner_whatsapp, message, { useSuperAdmin: true });
        await notifySuperAdmin('renewal', `⏰ *Lembrete 3 dias enviado*\n\n🏪 ${est.name}\n📱 ${est.owner_whatsapp}`);
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
- WhatsApp Automático (QR Code), Delivery e Balcão mantidos
- Sem mesas QR Code, comandas, impressão de cupom e reservas

Para recuperar seus benefícios:
💰 *Renove:* R$ 49,90/mês
🔗 ${getPublicBaseUrl()}/e/${est.slug}/admin/assinatura`;
      
      await sendWhatsAppMessage(est.owner_whatsapp, message, { useSuperAdmin: true });
      await notifySuperAdmin('renewal', `⚠️ *Assinatura Expirada*\n\n🍽️ ${est.name}\n📱 ${est.owner_whatsapp}\n\nRebaixado para Gratuito.`);
      
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
    const { months } = req.body;
    const monthsToAdd = months || 1;
    
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
    
    const message = `✅ *Assinatura Renovada!*\n\n🍽️ *Mais Que Cardápio*\n\nSua assinatura foi renovada com sucesso!\n\n📋 *Plano:* Premium\n📅 *Válido até:* ${est.paid_until ? new Date(est.paid_until).toLocaleDateString('pt-BR') : 'N/A'}\n\n🔗 ${getPublicBaseUrl(req)}/e/${est.slug}`;
    
    await sendWhatsAppMessage(est.owner_whatsapp, message, { useSuperAdmin: true });
    await notifySuperAdmin('renewal', `✅ *Assinatura Renovada*\n\n🏪 ${est.name}\n📅 ${monthsToAdd} mês(es)`);
    
    res.json({ success: true, paidUntil: est.paid_until });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao renovar assinatura' });
  }
});

// ============================================
// EVOLUTION API - INSTÂNCIA DO CONTRATANTE (QR CODE)
// ============================================

app.get('/api/e/evolution/status', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    const es = await getEstablishmentSettings(req.establishment.id);

    const globalUrl = ps.evolution_global_url || process.env.EVOLUTION_URL || '';
    const globalKey = ps.evolution_global_key || process.env.EVOLUTION_KEY || '';
    const allowTenant = ps.evolution_allow_tenant_instances !== '0';

    const apiUrl = es.evolution_api_url || globalUrl;
    const apiKey = es.evolution_api_key || globalKey;
    const instance = es.evolution_instance || '';

    let connected = false;
    let state = 'disconnected';

    if (apiUrl && apiKey && instance) {
      try {
        const stRes = await evolutionRequest(apiUrl, apiKey, `/instance/connectionState/${encodeURIComponent(instance)}`);
        state = stRes.data?.instance?.state || stRes.data?.state || 'disconnected';
        connected = stRes.ok && state === 'open';
      } catch {
        state = 'unreachable';
      }
    }

    res.json({
      global_configured: Boolean(globalUrl && globalKey),
      allow_tenant_instances: allowTenant,
      using_custom_server: Boolean(es.evolution_api_url),
      evolution_enabled: es.evolution_enabled === '1',
      instance,
      connected,
      state,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status da Evolution API' });
  }
});

app.post('/api/e/evolution/connect', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    const es = await getEstablishmentSettings(req.establishment.id);

    const apiUrl = es.evolution_api_url || ps.evolution_global_url || process.env.EVOLUTION_URL || '';
    const apiKey = es.evolution_api_key || ps.evolution_global_key || process.env.EVOLUTION_KEY || '';

    if (!apiUrl || !apiKey) {
      return res.status(400).json({
        error: 'Evolution API Global não configurada pelo SuperAdmin. Peça ao administrador ou configure uma URL/API Key própria.',
      });
    }

    if (!es.evolution_api_url && ps.evolution_allow_tenant_instances === '0') {
      return res.status(403).json({
        error: 'A criação automática de instâncias foi desabilitada pelo SuperAdmin.',
      });
    }

    const requestedInstance = (req.body?.instanceName || es.evolution_instance || `cardapio-${req.establishment.slug}`)
      .replace(/[^a-zA-Z0-9_-]/g, '-');

    const result = await connectOrCreateEvolutionInstance(apiUrl, apiKey, requestedInstance);

    await pool.execute(
      "INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
      [req.establishment.id, 'evolution_instance', requestedInstance, requestedInstance]
    );
    await pool.execute(
      "INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
      [req.establishment.id, 'evolution_enabled', '1', '1']
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erro ao conectar instância da loja:', error);
    res.status(500).json({ error: error?.message || 'Erro ao conectar instância na Evolution API' });
  }
});

app.post('/api/e/evolution/disconnect', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    const es = await getEstablishmentSettings(req.establishment.id);
    const apiUrl = es.evolution_api_url || ps.evolution_global_url || process.env.EVOLUTION_URL || '';
    const apiKey = es.evolution_api_key || ps.evolution_global_key || process.env.EVOLUTION_KEY || '';
    const instance = es.evolution_instance || '';

    if (apiUrl && apiKey && instance) {
      await evolutionRequest(apiUrl, apiKey, `/instance/logout/${encodeURIComponent(instance)}`, 'DELETE').catch(() => null);
    }

    await pool.execute(
      "INSERT INTO settings (establishment_id, `key`, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
      [req.establishment.id, 'evolution_enabled', '0', '0']
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desconectar instância' });
  }
});

app.post('/api/e/evolution/test', async (req: any, res) => {
  try {
    const es = await getEstablishmentSettings(req.establishment.id);
    const target = req.body?.phone || es.whatsapp_cashier || req.establishment.owner_whatsapp;
    if (!target) {
      return res.status(400).json({ error: 'Informe um número de WhatsApp para teste.' });
    }
    const ok = await sendEstablishmentWhatsApp(
      req.establishment.id,
      target,
      `✅ *Teste de Notificação - ${req.establishment.name}*\n\nSua instância WhatsApp está conectada e enviando alertas de pedidos!`
    );
    if (!ok) {
      return res.status(400).json({ error: 'Não foi possível enviar a mensagem. Verifique se a instância está conectada.' });
    }
    res.json({ success: true, message: `Mensagem de teste enviada para ${target}!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar teste' });
  }
});

// ============================================
// SISTEMA DE MENSALIDADES (PIX + INFINITEPAY)
// ============================================

// Endpoint para gerar PIX de mensalidade (usando a chave PIX do SuperAdmin)
app.post('/api/e/subscription/generate-pix', async (req: any, res) => {
  try {
    const { plan_id, months = 1 } = req.body;
    const ps = await getPlatformSettings();

    const [planRows] = await pool.execute('SELECT * FROM plans WHERE id = ?', [plan_id || 2]);
    const plan = (planRows as any[])[0];

    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const amount = parseFloat(plan.price) * months;
    const pixKey = ps.platform_pix_key || process.env.DEFAULT_PIX_KEY || '';
    if (!pixKey) {
      return res.status(400).json({ error: 'Chave PIX da plataforma não configurada no SuperAdmin.' });
    }
    const merchantName = ps.platform_pix_name || 'MaisQueCardapio';

    const txid = `SUB${req.establishment.id}${Date.now()}`.substring(0, 25);
    const pixCode = generatePixCode(pixKey, amount, merchantName, txid);

    const [result] = await pool.execute(`
      INSERT INTO payments (order_id, establishment_id, amount, pix_code, pix_qrcode, status, created_at)
      VALUES (NULL, ?, ?, ?, ?, 'pending', NOW())
    `, [req.establishment.id, amount, pixCode, pixCode]);

    const paymentId = (result as any).insertId;

    await notifySuperAdmin(
      'payment',
      `💳 *Novo PIX de Mensalidade Gerado*\n\n🏪 ${req.establishment.name}\n📋 Plano: ${plan.name} (${months} mês(es))\n💰 Valor: R$ ${amount.toFixed(2)}\n🆔 Pagamento #${paymentId}`
    );

    res.json({
      success: true,
      payment_id: paymentId,
      pix_code: pixCode,
      pix_qrcode: pixCode,
      amount: amount,
      plan_name: plan.name,
      months: months,
      support_whatsapp: ps.platform_support_whatsapp || '',
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
});

// Endpoint para gerar Checkout Link na InfinitePay para mensalidade
app.post('/api/e/subscription/infinitepay-checkout', async (req: any, res) => {
  try {
    const { plan_id = 2, months = 1 } = req.body;
    const ps = await getPlatformSettings();

    if (ps.infinitepay_enabled !== '1' || !ps.infinitepay_handle) {
      return res.status(400).json({ error: 'InfinitePay não está configurada pelo SuperAdmin.' });
    }

    const [planRows] = await pool.execute('SELECT * FROM plans WHERE id = ?', [plan_id]);
    const plan = (planRows as any[])[0];
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const amount = parseFloat(plan.price) * months;
    const priceInCents = Math.round(amount * 100);

    const [insertRes] = await pool.execute(
      `INSERT INTO payments (order_id, establishment_id, amount, payment_method, external_id, checkout_url, notes, status, created_at)
       VALUES (NULL, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [req.establishment.id, amount, 'infinitepay', null, null, `${plan.name} (${months} mês/meses)`]
    );
    const paymentId = (insertRes as any).insertId;
    const orderNsu = `SUB-${paymentId}`;

    const handle = ps.infinitepay_handle.replace(/^\$/, '').trim();
    const requestOrigin = getPublicBaseUrl(req);
    const redirectUrl = `${requestOrigin}/e/${req.establishment.slug}/admin/assinatura?payment=${paymentId}&status=returned`;
    const webhookUrl = `${requestOrigin}/api/webhook/infinitepay`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ps.infinitepay_api_key) {
      headers['X-Api-Key'] = ps.infinitepay_api_key;
    }

    const ipRes = await fetch('https://api.infinitepay.io/invoices/public/checkout/links', {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        handle,
        items: [
          {
            description: `MaisQueCardapio - ${plan.name} (${months} mês/meses)`,
            price: priceInCents,
            quantity: 1,
          },
        ],
        order_nsu: orderNsu,
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
      }),
    });

    const ipData: any = await ipRes.json().catch(() => ({}));
    const checkoutUrl = ipData?.url || ipData?.checkout_url || ipData?.link;

    if (!ipRes.ok || !checkoutUrl) {
      return res.status(502).json({
        error: ipData?.message || ipData?.error || 'Falha ao gerar link de checkout na InfinitePay. Verifique a InfiniteTag/API Key.',
      });
    }

    await pool.execute(
      `UPDATE payments SET checkout_url = ?, external_id = ? WHERE id = ?`,
      [checkoutUrl, orderNsu, paymentId]
    );

    await notifySuperAdmin(
      'payment',
      `💳 *Checkout InfinitePay Gerado*\n\n🏪 ${req.establishment.name}\n📋 Plano: ${plan.name} (${months} mês(es))\n💰 Valor: R$ ${amount.toFixed(2)}\n🔖 NSU: ${orderNsu}`
    );

    res.json({
      success: true,
      payment_id: paymentId,
      order_nsu: orderNsu,
      checkout_url: checkoutUrl,
      amount,
      plan_name: plan.name,
      months,
    });
  } catch (error) {
    console.error('Erro InfinitePay:', error);
    res.status(500).json({ error: 'Erro ao comunicar com a InfinitePay' });
  }
});

// Webhook público da InfinitePay (confirmação automática de assinaturas e pedidos)
app.post('/api/webhook/infinitepay', async (req, res) => {
  try {
    const payload = req.body || {};
    const orderNsu = String(payload.order_nsu || payload.external_id || '');
    console.log('💳 Webhook InfinitePay recebido:', orderNsu, payload);

    if (orderNsu.startsWith('SUB-')) {
      const paymentId = orderNsu.replace('SUB-', '');
      const [pRows] = await pool.execute(
        `SELECT p.*, e.owner_whatsapp, e.slug, e.name as establishment_name, pl.name as plan_name
         FROM payments p
         JOIN establishments e ON p.establishment_id = e.id
         LEFT JOIN plans pl ON e.plan_id = pl.id
         WHERE p.id = ?`,
        [paymentId]
      );
      const payment = (pRows as any[])[0];
      if (payment && payment.status !== 'confirmed' && payment.status !== 'paid') {
        await pool.execute(
          `UPDATE payments SET status = 'confirmed', paid_at = NOW(), confirmed_by = 'infinitepay' WHERE id = ?`,
          [paymentId]
        );
        await pool.execute(
          `UPDATE establishments
           SET status = 'active',
               plan_id = 2,
               paid_until = COALESCE(DATE_ADD(paid_until, INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 1 MONTH)),
               last_payment_at = NOW()
           WHERE id = ?`,
          [payment.establishment_id]
        );

        await sendWhatsAppMessage(
          payment.owner_whatsapp,
          `✅ *Pagamento InfinitePay Confirmado!*\n\n🍽️ *${payment.establishment_name}*\n💰 Valor: R$ ${parseFloat(payment.amount).toFixed(2)}\n📋 Plano Premium ativado automaticamente!\n\n🔗 ${getPublicBaseUrl(req)}/e/${payment.slug}`,
          { useSuperAdmin: true }
        );
        await notifySuperAdmin(
          'payment',
          `✅ *Pagamento InfinitePay Aprovado*\n\n🏪 ${payment.establishment_name}\n💰 R$ ${parseFloat(payment.amount).toFixed(2)}\n🔖 ${orderNsu}`
        );
      }
    } else if (orderNsu.startsWith('ORDER-')) {
      const orderId = orderNsu.replace('ORDER-', '');
      const [oRows] = await pool.execute(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      const order = (oRows as any[])[0];
      if (order && order.payment_status !== 'pago' && order.payment_status !== 'paid') {
        await pool.execute(`UPDATE orders SET payment_status = 'pago', status = 'confirmado', updated_at = NOW() WHERE id = ?`, [orderId]);
        await pool.execute(
          `UPDATE payments SET status = 'confirmed', paid_at = NOW(), confirmed_by = 'infinitepay' WHERE order_id = ? AND payment_method = 'infinitepay'`,
          [orderId]
        );
        await pool.execute(
          `INSERT INTO order_history (order_id, status, notes, created_by) VALUES (?, 'pago', 'Pagamento confirmado automaticamente via InfinitePay', 'infinitepay')`,
          [orderId]
        );

        const es = await getEstablishmentSettings(order.establishment_id);
        if (es.evolution_enabled === '1' && es.evolution_instance) {
          if (order.customer_phone) {
            await sendEstablishmentWhatsApp(
              order.establishment_id,
              order.customer_phone,
              `✅ *Pagamento InfinitePay Confirmado!*\n\n📦 *Pedido #${order.id}*\n💰 *Valor:* R$ ${(parseFloat(String(order.total)) || 0).toFixed(2)}\n\nSeu pedido foi confirmado e já está em preparo!`
            );
          }
          const notifyTarget = es.whatsapp_cashier || es.whatsapp_kitchen;
          if (notifyTarget) {
            await sendEstablishmentWhatsApp(
              order.establishment_id,
              notifyTarget,
              `💳 *Pagamento InfinitePay Aprovado!*\n\n📦 *Pedido #${order.id}*\n👤 *Cliente:* ${order.customer_name || 'N/A'}\n💰 *Total:* R$ ${(parseFloat(String(order.total)) || 0).toFixed(2)}`
            );
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook InfinitePay:', error);
    res.status(200).json({ received: true });
  }
});

// Endpoint para buscar status da assinatura + opções de pagamento configuradas pelo SuperAdmin
app.get('/api/e/subscription/status', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
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

    const paymentMode = ps.contractor_payment_mode || 'both';
    const pixConfigured = Boolean(ps.platform_pix_key || process.env.DEFAULT_PIX_KEY);
    const infinitepayConfigured = ps.infinitepay_enabled === '1' && Boolean(ps.infinitepay_handle);
    
    const features = await getEstablishmentPlanFeatures(est);

    res.json({
      plan: {
        id: est.plan_id,
        name: est.plan_name,
        price: parseFloat(est.plan_price) || 0,
        maxProducts: est.max_products,
        features: {
          ai: features.enableAi,
          reservations: features.enableReservations,
          automation: features.enableAutomation,
          tables: features.enableTables
        }
      },
      status: est.status,
      paid_until: est.paid_until,
      trial_ends_at: est.trial_ends_at,
      last_payment_at: est.last_payment_at,
      pending_payment: (pendingPayments as any[])[0] || null,
      payment_options: {
        mode: paymentMode,
        pix_enabled: (paymentMode === 'pix' || paymentMode === 'both') && pixConfigured,
        infinitepay_enabled: (paymentMode === 'infinitepay' || paymentMode === 'both') && infinitepayConfigured,
        support_whatsapp: ps.platform_support_whatsapp || '',
      }
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
    const ps = await getPlatformSettings();
    if (plan_id !== 1 && parseFloat(plan.price) > 0) {
      const amount = parseFloat(plan.price);
      const pixKey = ps.platform_pix_key || process.env.DEFAULT_PIX_KEY || '11999999999';
      const txid = `NEW${establishmentId}${Date.now()}`.substring(0, 25);
      const pixCode = generatePixCode(pixKey, amount, ps.platform_pix_name || `Mensalidade ${plan.name}`, txid);
      
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

    await notifySuperAdmin(
      'signup',
      `🆕 *Novo Cadastro (Plano ${plan.name})*\n\n🏪 *Loja:* ${name}\n🔗 *Slug:* /e/${slug}\n📱 *WhatsApp:* ${owner_whatsapp}\n📌 *Status:* ${status}`
    );
    
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
    
    if (status && status !== 'all') {
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
    
    // Enviar WhatsApp para o cliente via instância do SuperAdmin
    const message = `✅ *Pagamento Confirmado!*\n\n🍽️ *Mais Que Cardápio*\n\nOlá! Seu pagamento de *R$ ${parseFloat(payment.amount).toFixed(2)}* foi confirmado com sucesso!\n\n📋 *Plano:* ${payment.plan_name || 'Premium'}\n📅 *Válido até:* ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}\n\nSeu cardápio está ativo! 🎉\n\n🔗 Acesse: ${getPublicBaseUrl(req)}/e/${payment.slug}`;
    
    await sendWhatsAppMessage(payment.owner_whatsapp, message, { useSuperAdmin: true });
    await notifySuperAdmin('payment', `✅ *Pagamento Confirmado*\n\n💳 ID: #${paymentId}\n🏪 ${payment.establishment_name}\n💰 R$ ${parseFloat(payment.amount).toFixed(2)}\n📱 ${payment.owner_whatsapp}`);
    
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
    const message = `❌ *Pagamento Rejeitado*\n\n🍽️ *Mais Que Cardápio*\n\nOlá! Infelizmente não foi possível confirmar seu pagamento.\n\n${reason ? `*Motivo:* ${reason}` : ''}\n\n🔗 ${getPublicBaseUrl(req)}/e/${payment.slug}/admin/assinatura`;
    
    await sendWhatsAppMessage(payment.owner_whatsapp, message, { useSuperAdmin: true });
    
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

// ============================================
// SUPERADMIN - CONFIGURAÇÕES GLOBAIS & EVOLUTION
// ============================================

app.get('/api/superadmin/settings', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    res.json({
      contractor_payment_mode: ps.contractor_payment_mode || 'both',
      platform_pix_key: ps.platform_pix_key || '',
      platform_pix_name: ps.platform_pix_name || 'MaisQueCardapio',
      platform_support_whatsapp: ps.platform_support_whatsapp || '',
      infinitepay_enabled: ps.infinitepay_enabled || '0',
      infinitepay_handle: ps.infinitepay_handle || '',
      has_infinitepay_api_key: Boolean(ps.infinitepay_api_key),
      evolution_global_url: ps.evolution_global_url || '',
      has_evolution_global_key: Boolean(ps.evolution_global_key),
      evolution_allow_tenant_instances: ps.evolution_allow_tenant_instances !== '0' ? '1' : '0',
      superadmin_evolution_instance: ps.superadmin_evolution_instance || 'superadmin-maisquecardapio',
      superadmin_notify_whatsapp: ps.superadmin_notify_whatsapp || '',
      superadmin_notify_new_signup: ps.superadmin_notify_new_signup !== '0' ? '1' : '0',
      superadmin_notify_payment: ps.superadmin_notify_payment !== '0' ? '1' : '0',
      superadmin_notify_renewal: ps.superadmin_notify_renewal !== '0' ? '1' : '0',
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do SuperAdmin:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.post('/api/superadmin/settings', async (req: any, res) => {
  try {
    const allowedKeys = [
      'contractor_payment_mode',
      'platform_pix_key',
      'platform_pix_name',
      'platform_support_whatsapp',
      'infinitepay_enabled',
      'infinitepay_handle',
      'infinitepay_api_key',
      'evolution_global_url',
      'evolution_global_key',
      'evolution_allow_tenant_instances',
      'superadmin_evolution_instance',
      'superadmin_notify_whatsapp',
      'superadmin_notify_new_signup',
      'superadmin_notify_payment',
      'superadmin_notify_renewal',
    ];

    for (const key of allowedKeys) {
      if (req.body[key] === undefined) continue;
      // Para chaves secretas, só atualiza se o usuário enviou um valor novo não vazio
      if ((key === 'evolution_global_key' || key === 'infinitepay_api_key') && !String(req.body[key]).trim()) {
        continue;
      }
      await setPlatformSetting(key, String(req.body[key]));
    }

    res.json({ success: true, message: 'Configurações globais salvas!' });
  } catch (error) {
    console.error('Erro ao salvar configurações do SuperAdmin:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

app.get('/api/superadmin/evolution/status', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    const apiUrl = ps.evolution_global_url || process.env.EVOLUTION_URL || '';
    const apiKey = ps.evolution_global_key || process.env.EVOLUTION_KEY || '';
    const instance = ps.superadmin_evolution_instance || 'superadmin-maisquecardapio';

    let connected = false;
    let state = 'disconnected';
    if (apiUrl && apiKey && instance) {
      try {
        const stRes = await evolutionRequest(apiUrl, apiKey, `/instance/connectionState/${encodeURIComponent(instance)}`);
        state = stRes.data?.instance?.state || stRes.data?.state || 'disconnected';
        connected = stRes.ok && state === 'open';
      } catch {
        state = 'unreachable';
      }
    }

    res.json({
      configured: Boolean(apiUrl && apiKey),
      instance,
      connected,
      state,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar instância do SuperAdmin' });
  }
});

app.post('/api/superadmin/evolution/connect', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    const apiUrl = ps.evolution_global_url || process.env.EVOLUTION_URL || '';
    const apiKey = ps.evolution_global_key || process.env.EVOLUTION_KEY || '';
    if (!apiUrl || !apiKey) {
      return res.status(400).json({ error: 'Salve a URL e a API Key Global da Evolution API antes de conectar.' });
    }

    const instanceName = (req.body?.instanceName || ps.superadmin_evolution_instance || 'superadmin-maisquecardapio')
      .replace(/[^a-zA-Z0-9_-]/g, '-');
    await setPlatformSetting('superadmin_evolution_instance', instanceName);

    const result = await connectOrCreateEvolutionInstance(apiUrl, apiKey, instanceName);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erro ao conectar instância SuperAdmin:', error);
    res.status(500).json({ error: error?.message || 'Erro ao conectar instância na Evolution API' });
  }
});

app.post('/api/superadmin/evolution/disconnect', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    const apiUrl = ps.evolution_global_url || process.env.EVOLUTION_URL || '';
    const apiKey = ps.evolution_global_key || process.env.EVOLUTION_KEY || '';
    const instance = ps.superadmin_evolution_instance || 'superadmin-maisquecardapio';
    if (apiUrl && apiKey && instance) {
      await evolutionRequest(apiUrl, apiKey, `/instance/logout/${encodeURIComponent(instance)}`, 'DELETE').catch(() => null);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao desconectar instância' });
  }
});

app.post('/api/superadmin/evolution/test', async (req: any, res) => {
  try {
    const ps = await getPlatformSettings();
    const target = req.body?.phone || ps.superadmin_notify_whatsapp;
    if (!target) {
      return res.status(400).json({ error: 'Informe o WhatsApp do SuperAdmin para enviar o teste.' });
    }
    const ok = await sendWhatsAppMessage(
      target,
      `✅ *Teste SuperAdmin - MaisQueCardapio*\n\nSua instância de notificações administrativas está ativa para contratações, pagamentos e lembretes de renovação!`,
      { useSuperAdmin: true }
    );
    if (!ok) {
      return res.status(400).json({ error: 'Falha ao enviar mensagem. Verifique se a instância está conectada e a API Key está correta.' });
    }
    res.json({ success: true, message: `Mensagem de teste enviada para ${target}!` });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar mensagem de teste' });
  }
});

app.post('/api/superadmin/cron/check-renewals', async (req: any, res) => {
  const result = await checkExpiringSubscriptions();
  res.json({ success: true, ...result });
});

// ============================================================================
// SEO: robots.txt, sitemap.xml & Server-Side Meta / OpenGraph / JSON-LD Injection
// ============================================================================
const escapeHtmlAttr = (val: string): string =>
  String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeXml = (val: string): string =>
  String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const resolveSeoImageUrl = (rawUrl: string | undefined | null, baseUrl: string): string => {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return `${baseUrl}/og-image.jpg`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${baseUrl}${trimmed}`;
  return `${baseUrl}/og-image.jpg`;
};

async function buildRouteSeoData(reqPath: string, baseUrl: string) {
  const cleanPath = (reqPath || '/').split('?')[0] || '/';
  const canonicalPath = cleanPath === '/' ? '/' : cleanPath.replace(/\/+$/, '');
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  // Private / transactional routes -> noindex
  if (cleanPath === '/superadmin' || cleanPath.startsWith('/superadmin/')) {
    return {
      title: 'SuperAdmin | MaisQueCardapio',
      description: 'Gerenciamento administrativo da plataforma MaisQueCardapio.',
      robots: 'noindex, nofollow',
      canonicalUrl,
      ogType: 'website',
      ogImage: `${baseUrl}/og-image.jpg`,
      routeJsonLd: null as any
    };
  }

  const storeMatch = cleanPath.match(/^\/e\/([^/]+)(\/.*)?$/);
  if (storeMatch) {
    const slug = decodeURIComponent(storeMatch[1]);
    const subPath = storeMatch[2] || '';
    const isPrivateStoreRoute =
      subPath.startsWith('/admin') ||
      subPath.startsWith('/meus-pedidos') ||
      subPath.startsWith('/pedido');

    let storeName = slug;
    let storeImage = `${baseUrl}/og-image.jpg`;
    let acceptsReservations = 'False';
    try {
      const [estRows] = await pool.execute(
        'SELECT id, name, slug, plan_id FROM establishments WHERE slug = ? LIMIT 1',
        [slug]
      );
      const est = (estRows as any[])[0];
      if (est) {
        storeName = est.name || slug;
        const [setRows] = await pool.execute(
          "SELECT `key`, value FROM settings WHERE establishment_id = ? AND `key` IN ('store_name', 'cover_url', 'banner_url', 'logo_url')",
          [est.id]
        );
        const settingsMap: Record<string, string> = {};
        for (const r of setRows as any[]) {
          if (r?.key) settingsMap[r.key] = String(r.value || '');
        }
        if (settingsMap.store_name?.trim()) storeName = settingsMap.store_name.trim();
        storeImage = resolveSeoImageUrl(
          settingsMap.cover_url || settingsMap.banner_url || settingsMap.logo_url,
          baseUrl
        );
        const features = await getEstablishmentPlanFeatures(est);
        acceptsReservations = features.enableReservations ? 'True' : 'False';
      }
    } catch {
      // fallback safely if DB query fails
    }

    if (isPrivateStoreRoute) {
      return {
        title: `${storeName} | MaisQueCardapio`,
        description: `Área de gerenciamento e acompanhamento de pedidos de ${storeName}.`,
        robots: 'noindex, nofollow',
        canonicalUrl,
        ogType: 'website',
        ogImage: storeImage,
        routeJsonLd: null as any
      };
    }

    return {
      title: `${storeName} – Cardápio Digital Online | MaisQueCardapio`,
      description: `Peça online no cardápio digital de ${storeName}. Delivery rápido, retirada no balcão e pagamento via PIX ou InfinitePay sem taxas extras.`,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      canonicalUrl,
      ogType: 'restaurant',
      ogImage: storeImage,
      routeJsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: storeName,
        url: canonicalUrl,
        image: storeImage,
        servesCuisine: 'Lanches, Delivery e Restaurante',
        hasMenu: canonicalUrl,
        acceptsReservations
      }
    };
  }

  return {
    title: 'MaisQueCardapio – Cardápio Digital Sem Comissão e Delivery',
    description:
      'Crie seu cardápio digital sem comissão por pedido. Delivery por bairro, mesas QR Code, comandas, PIX, InfinitePay e WhatsApp automático.',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    canonicalUrl: `${baseUrl}/`,
    ogType: 'website',
    ogImage: `${baseUrl}/og-image.jpg`,
    routeJsonLd: null as any
  };
}

async function injectSeoIntoHtml(rawHtml: string, req: any): Promise<string> {
  const baseUrl = getPublicBaseUrl(req);
  const seo = await buildRouteSeoData(req.originalUrl || req.path || '/', baseUrl);

  let html = rawHtml
    .replace(/https:\/\/maisquecardapio\.to-ligado\.com/g, baseUrl)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlAttr(seo.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtmlAttr(seo.description)}" />`
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${escapeHtmlAttr(seo.robots)}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtmlAttr(seo.canonicalUrl)}" />`
    )
    .replace(
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:type" content="${escapeHtmlAttr(seo.ogType)}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${escapeHtmlAttr(seo.canonicalUrl)}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtmlAttr(seo.title)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtmlAttr(seo.description)}" />`
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${escapeHtmlAttr(seo.ogImage)}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${escapeHtmlAttr(seo.title)}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${escapeHtmlAttr(seo.description)}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${escapeHtmlAttr(seo.ogImage)}" />`
    );

  if (seo.routeJsonLd) {
    const safeJson = JSON.stringify(seo.routeJsonLd).replace(/</g, '\\u003c');
    html = html.replace(
      '</head>',
      `  <script id="mqc-jsonld-route" type="application/ld+json">${safeJson}</script>\n  </head>`
    );
  }
  return html;
}

app.get('/robots.txt', (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Allow: /e/',
    'Disallow: /api/',
    'Disallow: /superadmin',
    'Disallow: /e/*/admin',
    'Disallow: /e/*/meus-pedidos',
    'Disallow: /e/*/pedido/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    ''
  ].join('\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(robotsTxt);
});

app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const today = new Date().toISOString().split('T')[0];
  let storeSlugs: string[] = [];
  try {
    const [rows] = await pool.execute(
      "SELECT slug FROM establishments WHERE status = 'active' ORDER BY id ASC"
    );
    storeSlugs = (rows as any[])
      .map((r) => String(r?.slug || '').trim())
      .filter(Boolean);
  } catch {
    storeSlugs = ['demo'];
  }

  const urls = [
    { loc: `${baseUrl}/`, changefreq: 'weekly', priority: '1.0' },
    ...storeSlugs.map((slug) => ({
      loc: `${baseUrl}/e/${encodeURIComponent(slug)}`,
      changefreq: 'daily',
      priority: '0.8'
    }))
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    '</urlset>',
    ''
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  res.send(xml);
});

// Static files
app.use("/promo", express.static(path.join(__dirname, "public", "promo")));
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));
app.get(["/favicon.svg", "/og-image.jpg", "/site.webmanifest"], (req, res) => {
  const filePath = path.join(__dirname, "public", req.path.replace(/^\/+/, ""));
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).end();
});

if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(async (req, res, next) => {
    const reqPath = req.path || "/";
    const isSpaHtmlRequest =
      req.method === "GET" &&
      !reqPath.startsWith("/api/") &&
      !reqPath.startsWith("/@") &&
      !reqPath.startsWith("/src/") &&
      !reqPath.startsWith("/node_modules/") &&
      !path.extname(reqPath) &&
      (req.headers.accept?.includes("text/html") || req.headers.accept === "*/*" || !req.headers.accept);

    if (!isSpaHtmlRequest) {
      return next();
    }

    try {
      const rawTemplate = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      const transformed = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
      const html = await injectSeoIntoHtml(transformed, req);
      res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath, { index: false }));
  app.get("*", async (req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    try {
      const rawHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
      const html = await injectSeoIntoHtml(rawHtml, req);
      res.setHeader("Content-Type", "text/html; charset=utf-8").send(html);
    } catch {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });
}

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server on ${PORT}`));
