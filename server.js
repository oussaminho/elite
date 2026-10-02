import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const DISCORD_INVITE_URL = 'https://discord.gg/QCE2422UxJ';
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'adminelite';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'adminelite');
const isManagedPreview = Boolean(process.env.MANUS_PROJECT_ID);
const sessions = new Map();

const defaultProducts = [
  { product_key: 'spotify', name: 'Spotify Premium', category: 'Streaming', price: 9.99, period: '/ month', status: 'Active', status_tone: 'green', icon: 'S', icon_class: 'spotify', detail: 'Individual · 1 seat', accent: '#1ed760' },
  { product_key: 'discord', name: 'Discord', category: 'Social', price: 9.99, period: '/ month', status: 'Active', status_tone: 'green', icon: 'D', icon_class: 'discord', detail: 'Nitro · 1 account', accent: '#7d75ff' },
  { product_key: 'instagram', name: 'Instagram', category: 'Social', price: 12, period: '/ month', status: 'Renew soon', status_tone: 'orange', icon: '◎', icon_class: 'instagram', detail: 'Pro · 1 profile', accent: '#ff5c8a' },
  { product_key: 'chatgpt', name: 'ChatGPT', category: 'AI & Tools', price: 20, period: '/ month', status: 'Active', status_tone: 'green', icon: '✳', icon_class: 'chatgpt', detail: 'Plus · Priority access', accent: '#71d6be' },
  { product_key: 'ai', name: 'AI Tools Pro', category: 'AI & Tools', price: 29.9, period: '/ month', status: 'Active', status_tone: 'green', icon: '✦', icon_class: 'ai', detail: 'All-in-one · 12 tools', accent: '#ff5361' },
  { product_key: 'adobe', name: 'Adobe Premium', category: 'Creative', price: 54.99, period: '/ month', status: 'Active', status_tone: 'green', icon: 'A', icon_class: 'adobe', detail: 'All Apps · 1 seat', accent: '#fa3442' },
  { product_key: 'canva', name: 'Canva Pro', category: 'Creative', price: 14.99, period: '/ month', status: 'Active', status_tone: 'green', icon: 'C', icon_class: 'canva', detail: 'Teams · 3 seats', accent: '#21c6a8' },
  { product_key: 'steam', name: 'Steam Account', category: 'Gaming', price: 32.99, period: 'one-time', status: 'Active', status_tone: 'green', icon: 'S', icon_class: 'steam', detail: 'Premium library · 42 games', accent: '#8c9aa6' }
];

let memoryProducts = defaultProducts.map((product, index) => ({ ...product, id: index + 1 }));
let pool = null;

function normalizeProduct(product) {
  return {
    id: product.id,
    product_key: product.product_key,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    period: product.period,
    status: product.status,
    statusTone: product.status_tone,
    icon: product.icon,
    iconClass: product.icon_class,
    detail: product.detail,
    accent: product.accent
  };
}

async function getPool() {
  if (pool || !process.env.DATABASE_URL) return pool;
  try {
    pool = mysql.createPool(process.env.DATABASE_URL);
    await pool.query('SELECT 1');
    await pool.query(`CREATE TABLE IF NOT EXISTS elite_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_key VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(180) NOT NULL,
      category VARCHAR(80) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      period VARCHAR(40) NOT NULL DEFAULT '/ month',
      status VARCHAR(40) NOT NULL DEFAULT 'Active',
      status_tone VARCHAR(20) NOT NULL DEFAULT 'green',
      icon VARCHAR(20) NOT NULL DEFAULT 'E',
      icon_class VARCHAR(40) NOT NULL DEFAULT 'ai',
      detail VARCHAR(180) NOT NULL DEFAULT '',
      accent VARCHAR(20) NOT NULL DEFAULT '#ff3d43',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM elite_products');
    if (Number(rows[0].total) === 0) {
      for (const product of defaultProducts) {
        await pool.query(`INSERT INTO elite_products (product_key,name,category,price,period,status,status_tone,icon,icon_class,detail,accent)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [product.product_key, product.name, product.category, product.price, product.period, product.status, product.status_tone, product.icon, product.icon_class, product.detail, product.accent]);
      }
    }
    return pool;
  } catch (error) {
    console.error('[elite] database unavailable, using memory fallback:', error.message);
    pool = null;
    return null;
  }
}

async function listProducts() {
  const db = await getPool();
  if (!db) return memoryProducts.map(normalizeProduct);
  const [rows] = await db.query('SELECT * FROM elite_products ORDER BY id ASC');
  return rows.map(normalizeProduct);
}

async function createProduct(payload) {
  const product = {
    product_key: String(payload.product_key || `product-${Date.now()}`).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    name: String(payload.name || 'New product').trim(),
    category: String(payload.category || 'AI & Tools').trim(),
    price: Number(payload.price || 0),
    period: String(payload.period || '/ month').trim(),
    status: String(payload.status || 'Active').trim(),
    status_tone: String(payload.statusTone || payload.status_tone || 'green').trim(),
    icon: String(payload.icon || String(payload.name || 'E').trim().charAt(0) || 'E').trim().slice(0, 3),
    icon_class: String(payload.iconClass || payload.icon_class || 'ai').trim(),
    detail: String(payload.detail || 'Premium access').trim(),
    accent: String(payload.accent || '#ff3d43').trim()
  };
  const db = await getPool();
  if (!db) {
    product.id = Math.max(0, ...memoryProducts.map((item) => Number(item.id))) + 1;
    memoryProducts.push(product);
    return normalizeProduct(product);
  }
  const [result] = await db.query(`INSERT INTO elite_products (product_key,name,category,price,period,status,status_tone,icon,icon_class,detail,accent)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [product.product_key, product.name, product.category, product.price, product.period, product.status, product.status_tone, product.icon, product.icon_class, product.detail, product.accent]);
  const [rows] = await db.query('SELECT * FROM elite_products WHERE id = ?', [result.insertId]);
  return normalizeProduct(rows[0]);
}

async function updateProduct(id, payload) {
  const db = await getPool();
  if (!db) {
    const index = memoryProducts.findIndex((item) => Number(item.id) === Number(id));
    if (index < 0) return null;
    const current = memoryProducts[index];
    memoryProducts[index] = {
      ...current,
      ...payload,
      id: Number(id),
      price: Number(payload.price ?? current.price),
      status_tone: payload.status_tone ?? payload.statusTone ?? current.status_tone,
      icon_class: payload.icon_class ?? payload.iconClass ?? current.icon_class
    };
    return normalizeProduct(memoryProducts[index]);
  }
  const fields = ['name', 'category', 'price', 'period', 'status', 'status_tone', 'icon', 'icon_class', 'detail', 'accent'];
  const values = fields.map((field) => payload[field] ?? payload[camelCase(field)] ?? null);
  const updates = fields.filter((_, index) => values[index] !== null);
  const updateValues = values.filter((value) => value !== null);
  if (updates.length) await db.query(`UPDATE elite_products SET ${updates.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`, [...updateValues, id]);
  const [rows] = await db.query('SELECT * FROM elite_products WHERE id = ?', [id]);
  return rows[0] ? normalizeProduct(rows[0]) : null;
}

function camelCase(value) { return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()); }

async function deleteProduct(id) {
  const db = await getPool();
  if (!db) {
    const before = memoryProducts.length;
    memoryProducts = memoryProducts.filter((item) => Number(item.id) !== Number(id));
    return memoryProducts.length !== before;
  }
  const [result] = await db.query('DELETE FROM elite_products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

function cookieOptions() {
  return isManagedPreview ? 'HttpOnly; Path=/; SameSite=None; Secure; Max-Age=28800' : 'HttpOnly; Path=/; SameSite=Lax; Max-Age=28800';
}
function csrfCookieOptions() {
  return isManagedPreview ? 'Path=/; SameSite=None; Secure; Max-Age=28800' : 'Path=/; SameSite=Lax; Max-Age=28800';
}
function getCookie(req, name) {
  return String(req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.split('=').slice(1).join('=');
}
function requireCsrf(req, res, next) {
  const cookieToken = getCookie(req, 'elite_csrf');
  const headerToken = String(req.headers['x-csrf-token'] || '');
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length || !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) return res.status(403).json({ error: 'CSRF validation failed' });
  next();
}
function getSession(req) {
  const token = getCookie(req, 'elite_session');
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { sessions.delete(token); return null; }
  return session;
}
function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') return res.status(401).json({ error: 'Admin login required' });
  req.session = session;
  next();
}

app.use(express.json({ limit: '32kb' }));
app.get('/api/health', async (_req, res) => res.json({ ok: true, service: 'elite', database: Boolean(await getPool()) }));
app.get('/api/config', (_req, res) => res.json({ discordInviteUrl: DISCORD_INVITE_URL }));
app.get('/api/csrf', (_req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  res.setHeader('Set-Cookie', `elite_csrf=${token}; ${csrfCookieOptions()}`);
  res.json({ token });
});
app.get('/api/products', async (_req, res) => {
  try { res.json({ products: await listProducts() }); } catch (error) { res.status(500).json({ error: 'Unable to load products' }); }
});
app.get('/api/me', (req, res) => {
  const session = getSession(req);
  res.json(session ? { authenticated: true, role: session.role, username: session.username } : { authenticated: false, role: 'guest' });
});
app.post('/api/admin/login', requireCsrf, (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'Creator password is not configured' });
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid creator credentials' });
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { role: 'admin', username, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', `elite_session=${token}; ${cookieOptions()}`);
  res.json({ authenticated: true, role: 'admin', username });
});
app.post('/api/admin/logout', requireCsrf, (req, res) => {
  const token = getCookie(req, 'elite_session');
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `elite_session=; ${cookieOptions()}; Max-Age=0`);
  res.json({ authenticated: false, role: 'guest' });
});
app.post('/api/products', requireCsrf, requireAdmin, async (req, res) => {
  try { res.status(201).json({ product: await createProduct(req.body || {}) }); } catch (error) { res.status(400).json({ error: error.code === 'ER_DUP_ENTRY' ? 'Product key already exists' : 'Unable to create product' }); }
});
app.patch('/api/products/:id', requireCsrf, requireAdmin, async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.body || {});
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (_error) { res.status(400).json({ error: 'Unable to update product' }); }
});
app.delete('/api/products/:id', requireCsrf, requireAdmin, async (req, res) => {
  try { res.json({ deleted: await deleteProduct(req.params.id) }); } catch (_error) { res.status(400).json({ error: 'Unable to delete product' }); }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`[elite] listening on ${PORT}`));
}

start().catch((error) => { console.error('[elite] startup failed', error); process.exit(1); });
