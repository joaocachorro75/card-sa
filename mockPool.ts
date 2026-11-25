// In-memory mock pool for mysql2/promise when MySQL is not available (e.g., AI Studio sandbox)

interface Store {
  plans: any[];
  establishments: any[];
  categories: any[];
  products: any[];
  neighborhoods: any[];
  tables: any[];
  settings: any[];
  orders: any[];
  order_history: any[];
  payments: any[];
  customers: any[];
  commands: any[];
  reservations: any[];
  subscriptions: any[];
  reminders_sent: any[];
  platform_settings: { key: string; value: string }[];
}

const nextIds: Record<keyof Store, number> = {
  plans: 3,
  establishments: 2,
  categories: 3,
  products: 4,
  neighborhoods: 3,
  tables: 6,
  settings: 1,
  orders: 1,
  order_history: 1,
  payments: 1,
  customers: 1,
  commands: 1,
  reservations: 1,
  subscriptions: 1,
  reminders_sent: 1,
  platform_settings: 1,
};

const store: Store = {
  plans: [
    { id: 1, name: "Gratuito", price: 0, max_products: 10, enable_ai: 0, enable_reservations: 0, enable_automation: 1, enable_tables: 0 },
    { id: 2, name: "Premium", price: 49.90, max_products: 100, enable_ai: 1, enable_reservations: 1, enable_automation: 1, enable_tables: 1 },
  ],
  establishments: [
    {
      id: 1,
      name: "MaisQueCardapio Demo",
      slug: "demo",
      owner_whatsapp: "5511999999999",
      password: "admin123",
      plan_id: 2,
      status: "active",
      paid_until: null,
      trial_ends_at: null,
      last_payment_at: null,
      created_at: new Date().toISOString(),
    },
  ],
  categories: [
    { id: 1, establishment_id: 1, name: "Hambúrgueres" },
    { id: 2, establishment_id: 1, name: "Bebidas" },
  ],
  products: [
    {
      id: 1,
      establishment_id: 1,
      category_id: 1,
      name: "X-Burger Clássico",
      description: "Pão, carne 150g, queijo e maionese da casa.",
      price: 25.90,
      image_url: "/assets/demo/x-burger.jpg",
      is_available: 1,
    },
    {
      id: 2,
      establishment_id: 1,
      category_id: 1,
      name: "X-Bacon Especial",
      description: "Pão brioche, blend 180g, cheddar e bacon crocante.",
      price: 32.90,
      image_url: "/assets/demo/x-bacon.jpg",
      is_available: 1,
    },
    {
      id: 3,
      establishment_id: 1,
      category_id: 2,
      name: "Refrigerante Lata",
      description: "350ml bem gelado.",
      price: 7.00,
      image_url: "/assets/demo/refrigerante.jpg",
      is_available: 1,
    },
  ],
  neighborhoods: [
    { id: 1, establishment_id: 1, name: "Centro", delivery_fee: 5.00 },
    { id: 2, establishment_id: 1, name: "Jardins", delivery_fee: 8.00 },
  ],
  tables: [
    { id: 1, establishment_id: 1, number: 1, status: "available" },
    { id: 2, establishment_id: 1, number: 2, status: "available" },
    { id: 3, establishment_id: 1, number: 3, status: "available" },
    { id: 4, establishment_id: 1, number: 4, status: "available" },
    { id: 5, establishment_id: 1, number: 5, status: "available" },
  ],
  settings: [
    { establishment_id: 1, key: "pix_key", value: "11999999999" },
    { establishment_id: 1, key: "whatsapp_kitchen", value: "5511999999999" },
    { establishment_id: 1, key: "whatsapp_cashier", value: "5511999999999" },
    { establishment_id: 1, key: "store_name", value: "MaisQueCardapio Demo" },
    { establishment_id: 1, key: "primary_color", value: "#f97316" },
    { establishment_id: 1, key: "catalog_theme", value: "light" },
    { establishment_id: 1, key: "catalog_banner", value: "/assets/demo/banner-demo.jpg" },
    { establishment_id: 1, key: "is_open", value: "1" },
    { establishment_id: 1, key: "enable_reservations", value: "1" },
  ],
  orders: [],
  order_history: [],
  payments: [],
  customers: [],
  commands: [],
  reservations: [],
  subscriptions: [],
  reminders_sent: [],
  platform_settings: [
    { key: "contractor_payment_mode", value: "both" },
    { key: "platform_pix_key", value: "" },
    { key: "platform_pix_name", value: "MaisQueCardapio" },
    { key: "platform_support_whatsapp", value: "" },
    { key: "infinitepay_enabled", value: "0" },
    { key: "infinitepay_handle", value: "" },
    { key: "infinitepay_api_key", value: "" },
    { key: "evolution_global_url", value: "" },
    { key: "evolution_global_key", value: "" },
    { key: "evolution_allow_tenant_instances", value: "1" },
    { key: "superadmin_evolution_instance", value: "superadmin-maisquecardapio" },
    { key: "superadmin_notify_whatsapp", value: "" },
    { key: "superadmin_notify_new_signup", value: "1" },
    { key: "superadmin_notify_payment", value: "1" },
    { key: "superadmin_notify_renewal", value: "1" },
  ],
};

function normSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

export function createMockPool() {
  const execute = async (rawSql: string, params: any[] = []): Promise<[any, any[]]> => {
    const sql = normSql(rawSql);
    const upper = sql.toUpperCase();

    // DDL / health / show columns
    if (
      upper.startsWith("CREATE TABLE") ||
      upper.startsWith("ALTER TABLE")
    ) {
      return [{ affectedRows: 0 }, []];
    }
    if (upper.startsWith("SHOW COLUMNS")) {
      return [[{ Field: "exists" }], []];
    }
    if (upper === "SELECT 1") {
      return [[{ "1": 1 }], []];
    }

    // COUNT(*) queries
    if (upper.startsWith("SELECT COUNT(*)")) {
      if (upper.includes("FROM PLANS")) {
        return [[{ count: store.plans.length }], []];
      }
      if (upper.includes("FROM ESTABLISHMENTS WHERE PLAN_ID")) {
        const count = store.establishments.filter((e) => String(e.plan_id) === String(params[0])).length;
        return [[{ count }], []];
      }
      if (upper.includes("FROM PRODUCTS WHERE ESTABLISHMENT_ID")) {
        const count = store.products.filter((p) => String(p.establishment_id) === String(params[0])).length;
        return [[{ count }], []];
      }
      return [[{ count: 0 }], []];
    }

    // --- PLATFORM SETTINGS ---
    if (upper.includes("FROM PLATFORM_SETTINGS") && upper.startsWith("SELECT")) {
      return [store.platform_settings, []];
    }
    if (upper.startsWith("INSERT INTO PLATFORM_SETTINGS")) {
      const [key, value] = params;
      const existing = store.platform_settings.find((s) => s.key === key);
      if (existing) {
        existing.value = String(value ?? "");
      } else {
        store.platform_settings.push({ key, value: String(value ?? "") });
      }
      return [{ affectedRows: 1 }, []];
    }

    // --- REMINDERS SENT ---
    if (upper.includes("FROM REMINDERS_SENT") && upper.startsWith("SELECT")) {
      const rows = store.reminders_sent.filter(
        (r) => String(r.establishment_id) === String(params[0]) && r.type === params[1]
      );
      return [rows, []];
    }
    if (upper.startsWith("INSERT INTO REMINDERS_SENT")) {
      const id = nextIds.reminders_sent++;
      store.reminders_sent.push({
        id,
        establishment_id: Number(params[0]),
        type: params[1],
        sent_at: new Date().toISOString(),
      });
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // --- ESTABLISHMENTS ---
    if (upper.includes("FROM ESTABLISHMENTS") && upper.startsWith("SELECT")) {
      if (upper.includes("JOIN PLANS P")) {
        if (upper.includes("WHERE E.ID = ?")) {
          const est = store.establishments.find((e) => String(e.id) === String(params[0]));
          if (!est) return [[], []];
          const p = store.plans.find((pl) => pl.id === est.plan_id) || {};
          return [[{
            ...est,
            plan_name: p.name || "Gratuito",
            plan_price: p.price || 0,
            max_products: p.max_products ?? 10,
            enable_ai: p.enable_ai ?? 0,
            enable_reservations: p.enable_reservations ?? 0,
            enable_automation: p.enable_automation ?? 1,
            enable_tables: p.enable_tables ?? (Number(p.price) > 0 || p.id !== 1 ? 1 : 0),
          }], []];
        }
        if (upper.includes("LEFT JOIN PLANS P")) {
          const rows = store.establishments.map((e) => {
            const p = store.plans.find((pl) => pl.id === e.plan_id);
            return { ...e, plan_name: p?.name || null };
          });
          return [rows, []];
        }
        return [[], []];
      }
      if (upper.includes("WHERE SLUG = ?")) {
        const est = store.establishments.find((e) => e.slug === params[0]);
        return [est ? [est] : [], []];
      }
      if (upper.includes("WHERE OWNER_WHATSAPP IN")) {
        const est = store.establishments.find((e) => params.includes(e.owner_whatsapp));
        return [est ? [est] : [], []];
      }
      if (upper.includes("WHERE OWNER_WHATSAPP = ?")) {
        const est = store.establishments.find((e) => e.owner_whatsapp === params[0]);
        return [est ? [est] : [], []];
      }
      if (upper.includes("WHERE ID = ?")) {
        const est = store.establishments.find((e) => String(e.id) === String(params[0]));
        return [est ? [est] : [], []];
      }
      return [store.establishments, []];
    }

    if (upper.startsWith("INSERT INTO ESTABLISHMENTS")) {
      const id = nextIds.establishments++;
      const [name, slug, owner_whatsapp, password, plan_id = 1, status = "active"] = params;
      if (store.establishments.some((e) => e.slug === slug)) {
        throw new Error("Duplicate slug");
      }
      const row = {
        id,
        name,
        slug,
        owner_whatsapp,
        password,
        plan_id: Number(plan_id) || 1,
        status,
        paid_until: null,
        trial_ends_at: null,
        last_payment_at: null,
        created_at: new Date().toISOString(),
      };
      store.establishments.push(row);
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    if (upper.startsWith("UPDATE ESTABLISHMENTS")) {
      const id = params[params.length - 1];
      const est = store.establishments.find((e) => String(e.id) === String(id));
      if (est) {
        if (upper.includes("SET PLAN_ID = ?, STATUS = ?")) {
          est.plan_id = Number(params[0]);
          est.status = params[1];
        } else if (upper.includes("SET PLAN_ID = 2, STATUS = ?")) {
          est.plan_id = 2;
          est.status = params[0];
        } else if (upper.includes("SET PLAN_ID = ?")) {
          est.plan_id = Number(params[0]);
        } else if (upper.includes("SET STATUS = 'ACTIVE'")) {
          est.status = "active";
          est.plan_id = 2;
          est.last_payment_at = new Date().toISOString();
          est.paid_until = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
        } else if (upper.includes("PAID_UNTIL")) {
          est.plan_id = 2;
          est.status = "active";
          est.last_payment_at = new Date().toISOString();
          const months = Number(params[0]) || 1;
          est.paid_until = new Date(Date.now() + months * 30 * 86400000).toISOString().split("T")[0];
        }
      }
      return [{ affectedRows: est ? 1 : 0 }, []];
    }

    if (upper.startsWith("DELETE FROM ESTABLISHMENTS")) {
      const id = params[0];
      store.establishments = store.establishments.filter((e) => String(e.id) !== String(id));
      return [{ affectedRows: 1 }, []];
    }

    // --- PLANS ---
    if (upper.startsWith("SELECT * FROM PLANS")) {
      if (upper.includes("WHERE ID = ?")) {
        const plan = store.plans.find((p) => String(p.id) === String(params[0]));
        return [plan ? [plan] : [], []];
      }
      return [store.plans, []];
    }
    if (upper.startsWith("INSERT INTO PLANS")) {
      const id = nextIds.plans++;
      const [name, price, max_products, enable_ai, enable_reservations, enable_automation, enable_tables] = params;
      store.plans.push({
        id,
        name,
        price: Number(price) || 0,
        max_products: Number(max_products) || 0,
        enable_ai: enable_ai ? 1 : 0,
        enable_reservations: enable_reservations ? 1 : 0,
        enable_automation: enable_automation !== undefined ? (enable_automation ? 1 : 0) : 1,
        enable_tables: enable_tables !== undefined ? (enable_tables ? 1 : 0) : (Number(price) > 0 ? 1 : 0),
      });
      return [{ insertId: id, affectedRows: 1 }, []];
    }
    if (upper.startsWith("UPDATE PLANS")) {
      const id = params[params.length - 1];
      const [name, price, max_products, enable_ai, enable_reservations, enable_automation, maybeTables] = params;
      const plan = store.plans.find((p) => String(p.id) === String(id));
      if (plan) {
        Object.assign(plan, {
          name,
          price: Number(price) || 0,
          max_products: Number(max_products) || 0,
          enable_ai: enable_ai ? 1 : 0,
          enable_reservations: enable_reservations ? 1 : 0,
          enable_automation: enable_automation !== undefined ? (enable_automation ? 1 : 0) : 1,
          enable_tables: params.length >= 8 ? (maybeTables ? 1 : 0) : (Number(price) > 0 || plan.id !== 1 ? 1 : 0),
        });
      }
      return [{ affectedRows: plan ? 1 : 0 }, []];
    }
    if (upper.startsWith("DELETE FROM PLANS")) {
      store.plans = store.plans.filter((p) => String(p.id) !== String(params[0]));
      return [{ affectedRows: 1 }, []];
    }

    // --- CATEGORIES ---
    if (upper.startsWith("SELECT * FROM CATEGORIES")) {
      return [store.categories.filter((c) => String(c.establishment_id) === String(params[0])), []];
    }
    if (upper.startsWith("INSERT INTO CATEGORIES")) {
      const id = nextIds.categories++;
      store.categories.push({ id, establishment_id: Number(params[0]), name: params[1] });
      return [{ insertId: id, affectedRows: 1 }, []];
    }
    if (upper.startsWith("UPDATE CATEGORIES")) {
      const [name, id, estId] = params;
      const cat = store.categories.find((c) => String(c.id) === String(id) && String(c.establishment_id) === String(estId));
      if (cat) cat.name = String(name);
      return [{ affectedRows: cat ? 1 : 0 }, []];
    }
    if (upper.startsWith("DELETE FROM CATEGORIES")) {
      if (params.length === 2) {
        store.categories = store.categories.filter((c) => !(String(c.id) === String(params[0]) && String(c.establishment_id) === String(params[1])));
      } else {
        store.categories = store.categories.filter((c) => String(c.establishment_id) !== String(params[0]));
      }
      return [{ affectedRows: 1 }, []];
    }

    // --- PRODUCTS ---
    if (upper.includes("COUNT(*) AS COUNT FROM PRODUCTS")) {
      const count = store.products.filter((p) => String(p.establishment_id) === String(params[0])).length;
      return [[{ count }], []];
    }
    if (upper.startsWith("SELECT * FROM PRODUCTS")) {
      return [store.products.filter((p) => String(p.establishment_id) === String(params[0])), []];
    }
    if (upper.startsWith("INSERT INTO PRODUCTS")) {
      const id = nextIds.products++;
      const [establishment_id, category_id, name, description, price, image_url] = params;
      store.products.push({
        id,
        establishment_id: Number(establishment_id),
        category_id: category_id ? Number(category_id) : null,
        name,
        description,
        price: Number(price) || 0,
        image_url,
        is_available: 1,
      });
      return [{ insertId: id, affectedRows: 1 }, []];
    }
    if (upper.startsWith("UPDATE PRODUCTS SET CATEGORY_ID = NULL")) {
      const [catId, estId] = params;
      for (const p of store.products) {
        if (String(p.category_id) === String(catId) && String(p.establishment_id) === String(estId)) {
          p.category_id = null;
        }
      }
      return [{ affectedRows: 1 }, []];
    }
    if (upper.startsWith("UPDATE PRODUCTS")) {
      const [category_id, name, description, price, image_url, is_available, id, estId] = params;
      const prod = store.products.find((p) => String(p.id) === String(id) && String(p.establishment_id) === String(estId));
      if (prod) {
        Object.assign(prod, { category_id: category_id ? Number(category_id) : null, name, description, price: Number(price), image_url, is_available: is_available ? 1 : 0 });
      }
      return [{ affectedRows: prod ? 1 : 0 }, []];
    }
    if (upper.startsWith("DELETE FROM PRODUCTS")) {
      if (params.length === 2) {
        store.products = store.products.filter((p) => !(String(p.id) === String(params[0]) && String(p.establishment_id) === String(params[1])));
      } else {
        store.products = store.products.filter((p) => String(p.establishment_id) !== String(params[0]));
      }
      return [{ affectedRows: 1 }, []];
    }

    // --- NEIGHBORHOODS ---
    if (upper.startsWith("SELECT * FROM NEIGHBORHOODS")) {
      return [store.neighborhoods.filter((n) => String(n.establishment_id) === String(params[0])), []];
    }
    if (upper.startsWith("INSERT INTO NEIGHBORHOODS")) {
      const id = nextIds.neighborhoods++;
      store.neighborhoods.push({ id, establishment_id: Number(params[0]), name: params[1], delivery_fee: Number(params[2]) || 0 });
      return [{ insertId: id, affectedRows: 1 }, []];
    }
    if (upper.startsWith("DELETE FROM NEIGHBORHOODS")) {
      if (params.length === 2) {
        store.neighborhoods = store.neighborhoods.filter((n) => !(String(n.id) === String(params[0]) && String(n.establishment_id) === String(params[1])));
      } else {
        store.neighborhoods = store.neighborhoods.filter((n) => String(n.establishment_id) !== String(params[0]));
      }
      return [{ affectedRows: 1 }, []];
    }

    // --- TABLES ---
    if (upper.startsWith("SELECT * FROM TABLES")) {
      return [
        store.tables
          .filter((t) => String(t.establishment_id) === String(params[0]))
          .sort((a, b) => a.number - b.number),
        [],
      ];
    }
    if (upper.startsWith("INSERT INTO TABLES")) {
      const estId = Number(params[0]);
      const number = Number(params[1]);
      if (store.tables.some((t) => t.establishment_id === estId && t.number === number)) {
        throw new Error("Duplicate table");
      }
      const id = nextIds.tables++;
      store.tables.push({ id, establishment_id: estId, number, status: "available" });
      return [{ insertId: id, affectedRows: 1 }, []];
    }
    if (upper.startsWith("DELETE FROM TABLES")) {
      if (params.length === 2) {
        store.tables = store.tables.filter((t) => !(String(t.id) === String(params[0]) && String(t.establishment_id) === String(params[1])));
      } else {
        store.tables = store.tables.filter((t) => String(t.establishment_id) !== String(params[0]));
      }
      return [{ affectedRows: 1 }, []];
    }

    // --- COMMANDS ---
    if (upper.includes(" COMMANDS")) {
      if (upper.startsWith("SELECT")) {
        if (upper.includes("TABLE_ID = ?") && upper.includes("STATUS = 'OPEN'")) {
          const rows = store.commands
            .filter((c) => c.status === "open" && String(c.establishment_id) === String(params[0]) && String(c.table_id) === String(params[1]))
            .sort((a, b) => b.id - a.id);
          return [rows, []];
        }
        const rows = store.commands
          .filter((c) => c.status === "open" && String(c.establishment_id) === String(params[0]))
          .map((c) => {
            const t = store.tables.find((tb) => tb.id === c.table_id);
            return { ...c, table_number: t?.number || null };
          })
          .sort((a, b) => b.id - a.id);
        return [rows, []];
      }
      if (upper.startsWith("INSERT INTO COMMANDS")) {
        const id = nextIds.commands++;
        store.commands.push({
          id,
          establishment_id: Number(params[0]),
          table_id: params[1] ? Number(params[1]) : null,
          waiter_name: params[2],
          status: "open",
          bill_requested_at: null,
          created_at: new Date().toISOString(),
        });
        return [{ insertId: id, affectedRows: 1 }, []];
      }
      if (upper.startsWith("UPDATE COMMANDS")) {
        if (upper.includes("SET BILL_REQUESTED_AT = NOW()")) {
          const cmd = store.commands.find((c) => String(c.id) === String(params[0]) && String(c.establishment_id) === String(params[1]));
          if (cmd) cmd.bill_requested_at = new Date().toISOString();
          return [{ affectedRows: cmd ? 1 : 0 }, []];
        }
        const cmd = store.commands.find((c) => String(c.id) === String(params[1]) && String(c.establishment_id) === String(params[2]));
        if (cmd) {
          cmd.status = params[0];
          if (params[0] === "closed") {
            cmd.bill_requested_at = null;
          }
        }
        return [{ affectedRows: cmd ? 1 : 0 }, []];
      }
    }

    // --- SETTINGS ---
    if (upper.includes("FROM SETTINGS") && upper.startsWith("SELECT")) {
      const estId = String(params[0]);
      if (upper.includes("`KEY` = 'PIX_KEY'") || upper.includes("KEY = 'PIX_KEY'")) {
        const row = store.settings.find((s) => String(s.establishment_id) === estId && s.key === "pix_key");
        return [row ? [row] : [], []];
      }
      if (upper.includes("`KEY` = 'WHATSAPP_CASHIER'") || upper.includes("KEY = 'WHATSAPP_CASHIER'")) {
        const row = store.settings.find((s) => String(s.establishment_id) === estId && s.key === "whatsapp_cashier");
        return [row ? [row] : [], []];
      }
      if (upper.includes("IN ('WHATSAPP_CASHIER', 'WHATSAPP_KITCHEN')")) {
        const rows = store.settings.filter(
          (s) => String(s.establishment_id) === estId && (s.key === "whatsapp_cashier" || s.key === "whatsapp_kitchen")
        );
        return [rows, []];
      }
      return [store.settings.filter((s) => String(s.establishment_id) === estId), []];
    }
    if (upper.startsWith("INSERT INTO SETTINGS")) {
      const [estId, key, value] = params;
      const existing = store.settings.find((s) => String(s.establishment_id) === String(estId) && s.key === key);
      if (existing) {
        existing.value = String(value ?? "");
      } else {
        store.settings.push({ establishment_id: Number(estId), key, value: String(value ?? "") });
      }
      return [{ affectedRows: 1 }, []];
    }
    if (upper.startsWith("DELETE FROM SETTINGS")) {
      store.settings = store.settings.filter((s) => String(s.establishment_id) !== String(params[0]));
      return [{ affectedRows: 1 }, []];
    }

    // --- ORDERS ---
    if (upper.includes("FROM ORDERS") && upper.startsWith("SELECT")) {
      if (upper.includes("COALESCE(SUM(TOTAL), 0)") && upper.includes("PAYMENT_STATUS IN")) {
        const paid = store.orders.filter((o) => String(o.establishment_id) === String(params[0]) && (o.payment_status === "pago" || o.payment_status === "paid"));
        const total = paid.reduce((s, o) => s + (Number(o.total) || 0), 0);
        return [[{ total }], []];
      }
      if (upper.includes("COALESCE(AVG(TOTAL), 0)")) {
        const paid = store.orders.filter((o) => String(o.establishment_id) === String(params[0]) && (o.payment_status === "pago" || o.payment_status === "paid"));
        const avg = paid.length ? paid.reduce((s, o) => s + (Number(o.total) || 0), 0) / paid.length : 0;
        return [[{ avg }], []];
      }
      if (upper.includes("COUNT(*) AS COUNT, COALESCE(SUM(TOTAL), 0) AS TOTAL")) {
        const matching = store.orders.filter((o) => String(o.establishment_id) === String(params[0]));
        const total = matching.reduce((s, o) => s + (Number(o.total) || 0), 0);
        return [[{ count: matching.length, total }], []];
      }
      if (upper.includes("GROUP BY STATUS")) {
        const map = new Map<string, number>();
        for (const o of store.orders.filter((o) => String(o.establishment_id) === String(params[0]))) {
          map.set(o.status, (map.get(o.status) || 0) + 1);
        }
        return [Array.from(map.entries()).map(([status, count]) => ({ status, count })), []];
      }
      if (upper.includes("WHERE O.ID = ? AND O.ESTABLISHMENT_ID = ?")) {
        const order = store.orders.find((o) => String(o.id) === String(params[0]) && String(o.establishment_id) === String(params[1]));
        if (!order) return [[], []];
        const nb = store.neighborhoods.find((n) => n.id === order.neighborhood_id);
        const est = store.establishments.find((e) => e.id === order.establishment_id);
        return [[{ ...order, neighborhood_name: nb?.name || null, neighborhood_fee: nb?.delivery_fee || 0, slug: est?.slug || "" }], []];
      }
      if (upper.includes("WHERE ID = ? AND ESTABLISHMENT_ID = ?")) {
        const order = store.orders.find((o) => String(o.id) === String(params[0]) && String(o.establishment_id) === String(params[1]));
        return [order ? [order] : [], []];
      }
      if (upper.includes("WHERE ID = ?")) {
        const order = store.orders.find((o) => String(o.id) === String(params[0]));
        return [order ? [order] : [], []];
      }
      if (upper.includes("O.CUSTOMER_PHONE = ?")) {
        const rows = store.orders
          .filter((o) => String(o.establishment_id) === String(params[0]) && o.customer_phone === params[1])
          .map((o) => {
            const nb = store.neighborhoods.find((n) => n.id === o.neighborhood_id);
            return { ...o, neighborhood_name: nb?.name || null };
          })
          .sort((a, b) => b.id - a.id);
        return [rows, []];
      }
      if (upper.includes("CUSTOMER_PHONE = (SELECT PHONE FROM CUSTOMERS")) {
        const cust = store.customers.find((c) => String(c.id) === String(params[0]));
        if (!cust) return [[], []];
        return [store.orders.filter((o) => o.customer_phone === cust.phone).sort((a, b) => b.id - a.id), []];
      }
      // List orders for establishment
      const rows = store.orders
        .filter((o) => String(o.establishment_id) === String(params[0]))
        .map((o) => {
          const nb = store.neighborhoods.find((n) => n.id === o.neighborhood_id);
          return { ...o, neighborhood_name: nb?.name || null, neighborhood_fee: nb?.delivery_fee || 0 };
        })
        .sort((a, b) => b.id - a.id);
      return [rows, []];
    }

    if (upper.startsWith("INSERT INTO ORDERS")) {
      const id = nextIds.orders++;
      const [
        establishment_id, customer_name, customer_phone, customer_email,
        address, address_number, address_complement, address_reference,
        neighborhood_id, total, delivery_fee, payment_method, payment_status,
        pix_code, pix_qrcode, pix_expires_at, type, items_text, notes,
      ] = params;
      const now = new Date().toISOString();
      store.orders.push({
        id,
        establishment_id: Number(establishment_id),
        customer_name,
        customer_phone,
        customer_email,
        address,
        address_number,
        address_complement,
        address_reference,
        neighborhood_id: neighborhood_id ? Number(neighborhood_id) : null,
        total: Number(total) || 0,
        delivery_fee: Number(delivery_fee) || 0,
        payment_method,
        payment_status: payment_status || "pendente",
        pix_code,
        pix_qrcode,
        pix_expires_at,
        status: "pendente",
        notes,
        type,
        items_text,
        created_at: now,
        updated_at: now,
      });
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    if (upper.startsWith("UPDATE ORDERS")) {
      const now = new Date().toISOString();
      if (upper.includes("SET PAYMENT_STATUS = 'PAID', UPDATED_AT = NOW() WHERE ID = ? AND ESTABLISHMENT_ID = ?")) {
        const order = store.orders.find((o) => String(o.id) === String(params[0]) && String(o.establishment_id) === String(params[1]));
        if (order) {
          order.payment_status = "paid";
          order.updated_at = now;
        }
      } else if (upper.includes("SET PAYMENT_STATUS = 'PAID'")) {
        const order = store.orders.find((o) => String(o.id) === String(params[0]) && String(o.establishment_id) === String(params[1]));
        if (order) {
          order.payment_status = "paid";
          order.status = "confirmed";
          order.updated_at = now;
        }
      } else if (upper.includes("SET PAYMENT_STATUS = 'PAGO'")) {
        const order = store.orders.find((o) => String(o.id) === String(params[0]));
        if (order) {
          order.payment_status = "pago";
          order.status = "confirmado";
          order.updated_at = now;
        }
      } else if (upper.includes("SET PAYMENT_STATUS = 'PAGAMENTO_EM_ANALISE'")) {
        const order = store.orders.find((o) => String(o.id) === String(params[0]));
        if (order) {
          order.payment_status = "pagamento_em_analise";
          order.updated_at = now;
        }
      } else if (upper.includes("SET STATUS = ?")) {
        const order = store.orders.find((o) => String(o.id) === String(params[1]));
        if (order) {
          order.status = params[0];
          order.updated_at = now;
        }
      } else if (upper.includes("SET PAYMENT_STATUS = ?")) {
        const order = store.orders.find((o) => String(o.id) === String(params[1]));
        if (order) {
          order.payment_status = params[0];
          order.updated_at = now;
        }
      }
      return [{ affectedRows: 1 }, []];
    }

    if (upper.startsWith("DELETE FROM ORDERS")) {
      store.orders = store.orders.filter((o) => String(o.establishment_id) !== String(params[0]));
      return [{ affectedRows: 1 }, []];
    }

    // --- ORDER HISTORY ---
    if (upper.startsWith("SELECT * FROM ORDER_HISTORY")) {
      return [store.order_history.filter((h) => String(h.order_id) === String(params[0])).sort((a, b) => b.id - a.id), []];
    }
    if (upper.startsWith("INSERT INTO ORDER_HISTORY")) {
      const id = nextIds.order_history++;
      let status = "pending";
      let notes = "";
      let created_by = "system";
      if (params.length === 2) {
        // VALUES (?, 'pending', 'Pedido criado', 'customer') or VALUES (?, 'pagamento_em_analise', ...)
        status = upper.includes("'PAGAMENTO_EM_ANALISE'") ? "pagamento_em_analise" : upper.includes("'PAID'") ? "paid" : "pending";
        notes = params[1] || "";
        created_by = upper.includes("'ADMIN'") ? "admin" : "customer";
      } else {
        status = params[1];
        notes = params[2] || "";
        created_by = upper.includes("'ADMIN'") ? "admin" : "system";
      }
      store.order_history.push({
        id,
        order_id: Number(params[0]),
        status,
        notes,
        created_by,
        created_at: new Date().toISOString(),
      });
      return [{ insertId: id, affectedRows: 1 }, []];
    }

    // --- CUSTOMERS ---
    if (upper.includes(" CUSTOMERS")) {
      if (upper.startsWith("SELECT")) {
        if (upper.includes("PHONE = ? AND PASSWORD = ?")) {
          const cust = store.customers.find(
            (c) => String(c.establishment_id) === String(params[0]) && c.phone === params[1] && c.password === params[2]
          );
          return [cust ? [cust] : [], []];
        }
        const rows = store.customers
          .filter((c) => String(c.establishment_id) === String(params[0]))
          .map((c) => {
            const nb = store.neighborhoods.find((n) => String(n.id) === String(c.neighborhood_id));
            return { ...c, neighborhood_name: nb?.name || null };
          })
          .sort((a, b) => {
            const ta = new Date(a.last_order_at || a.created_at || 0).getTime();
            const tb = new Date(b.last_order_at || b.created_at || 0).getTime();
            return tb - ta;
          });
        return [rows, []];
      }
      if (upper.startsWith("INSERT INTO CUSTOMERS")) {
        const estId = Number(params[0]);
        const name = params[1];
        const phone = params[2];
        const existing = store.customers.find((c) => c.establishment_id === estId && c.phone === phone);

        if (params.length >= 10) {
          const [, , , email, address, address_number, address_complement, address_reference, neighborhood_id, total] = params;
          const now = new Date().toISOString();
          if (existing) {
            if (upper.includes("ON DUPLICATE KEY UPDATE")) {
              existing.name = name || existing.name;
              existing.email = email || existing.email || null;
              existing.address = address ?? existing.address ?? null;
              existing.address_number = address_number ?? existing.address_number ?? null;
              existing.address_complement = address_complement ?? existing.address_complement ?? null;
              existing.address_reference = address_reference ?? existing.address_reference ?? null;
              existing.neighborhood_id = neighborhood_id ?? existing.neighborhood_id ?? null;
              existing.total_orders = (Number(existing.total_orders) || 0) + 1;
              existing.total_spent = (Number(existing.total_spent) || 0) + (Number(total) || 0);
              existing.last_order_at = now;
              return [{ insertId: existing.id, affectedRows: 1 }, []];
            }
            throw new Error("Duplicate customer phone");
          }
          const id = nextIds.customers++;
          store.customers.push({
            id,
            establishment_id: estId,
            name: name || "Cliente",
            phone,
            email: email || null,
            password: "",
            address: address || null,
            address_number: address_number || null,
            address_complement: address_complement || null,
            address_reference: address_reference || null,
            neighborhood_id: neighborhood_id ? Number(neighborhood_id) : null,
            total_orders: 1,
            total_spent: Number(total) || 0,
            created_at: now,
            last_order_at: now,
          });
          return [{ insertId: id, affectedRows: 1 }, []];
        }

        // Manual admin insert (8+ params) or public register (4 params)
        if (existing) {
          throw new Error("Duplicate customer phone");
        }
        const id = nextIds.customers++;
        const now = new Date().toISOString();
        if (params.length >= 8) {
          const [, , , email, address, address_number, address_complement, address_reference, neighborhood_id] = params;
          store.customers.push({
            id,
            establishment_id: estId,
            name,
            phone,
            email: email || null,
            password: "",
            address: address || null,
            address_number: address_number || null,
            address_complement: address_complement || null,
            address_reference: address_reference || null,
            neighborhood_id: neighborhood_id ? Number(neighborhood_id) : null,
            total_orders: 0,
            total_spent: 0,
            created_at: now,
            last_order_at: null,
          });
        } else {
          store.customers.push({
            id,
            establishment_id: estId,
            name,
            phone,
            email: null,
            password: params[3] || "",
            address: null,
            address_number: null,
            address_complement: null,
            address_reference: null,
            neighborhood_id: null,
            total_orders: 0,
            total_spent: 0,
            created_at: now,
            last_order_at: null,
          });
        }
        return [{ insertId: id, affectedRows: 1 }, []];
      }
      if (upper.startsWith("DELETE FROM CUSTOMERS")) {
        if (params.length === 2) {
          store.customers = store.customers.filter(
            (c) => !(String(c.id) === String(params[0]) && String(c.establishment_id) === String(params[1]))
          );
        } else {
          store.customers = store.customers.filter((c) => String(c.establishment_id) !== String(params[0]));
        }
        return [{ affectedRows: 1 }, []];
      }
    }

    // --- RESERVATIONS ---
    if (upper.includes(" RESERVATIONS")) {
      if (upper.startsWith("SELECT")) {
        const rows = store.reservations
          .filter((r) => String(r.establishment_id) === String(params[0]))
          .map((r) => {
            const t = store.tables.find((tb) => tb.id === r.table_id);
            return { ...r, table_number: t?.number || null };
          });
        return [rows, []];
      }
      if (upper.startsWith("INSERT INTO RESERVATIONS")) {
        const id = nextIds.reservations++;
        const [establishment_id, customer_name, customer_phone, table_id, reservation_time, guests] = params;
        store.reservations.push({
          id,
          establishment_id: Number(establishment_id),
          customer_name,
          customer_phone,
          table_id: table_id ? Number(table_id) : null,
          reservation_time,
          guests: Number(guests) || 1,
          status: "pending",
          created_at: new Date().toISOString(),
        });
        return [{ insertId: id, affectedRows: 1 }, []];
      }
      if (upper.startsWith("UPDATE RESERVATIONS")) {
        const resv = store.reservations.find((r) => String(r.id) === String(params[1]) && String(r.establishment_id) === String(params[2]));
        if (resv) resv.status = params[0];
        return [{ affectedRows: resv ? 1 : 0 }, []];
      }
      if (upper.startsWith("DELETE FROM RESERVATIONS")) {
        if (params.length === 2) {
          store.reservations = store.reservations.filter((r) => !(String(r.id) === String(params[0]) && String(r.establishment_id) === String(params[1])));
        } else {
          store.reservations = store.reservations.filter((r) => String(r.establishment_id) !== String(params[0]));
        }
        return [{ affectedRows: 1 }, []];
      }
    }

    // --- PAYMENTS ---
    if (upper.includes(" PAYMENTS")) {
      if (upper.startsWith("SELECT")) {
        if (upper.includes("WHERE ORDER_ID = ?")) {
          const rows = store.payments
            .filter((p) => String(p.order_id) === String(params[0]) && (!upper.includes("PAYMENT_METHOD = 'INFINITEPAY'") || p.payment_method === "infinitepay"))
            .sort((a, b) => b.id - a.id);
          return [rows, []];
        }
        if (upper.includes("WHERE ESTABLISHMENT_ID = ? AND STATUS = 'PENDING'")) {
          const rows = store.payments.filter((p) => String(p.establishment_id) === String(params[0]) && p.status === "pending");
          return [rows, []];
        }
        if (upper.includes("WHERE P.ID = ?")) {
          const p = store.payments.find((pm) => String(pm.id) === String(params[0]));
          if (!p) return [[], []];
          const est = store.establishments.find((e) => e.id === p.establishment_id) || {};
          const plan = store.plans.find((pl) => pl.id === est.plan_id) || {};
          return [[{
            ...p,
            establishment_name: est.name,
            establishment_slug: est.slug,
            slug: est.slug,
            owner_whatsapp: est.owner_whatsapp,
            establishment_status: est.status,
            plan_name: plan.name,
          }], []];
        }
        let filtered = [...store.payments];
        if (upper.includes("AND P.STATUS = ?")) {
          const st = params[0];
          filtered = filtered.filter((p) => p.status === st);
        }
        if (upper.includes("AND P.ESTABLISHMENT_ID = ?")) {
          const estIdx = upper.includes("AND P.STATUS = ?") ? 1 : 0;
          filtered = filtered.filter((p) => String(p.establishment_id) === String(params[estIdx]));
        }
        const rows = filtered
          .sort((a, b) => b.id - a.id)
          .map((p) => {
            const est = store.establishments.find((e) => e.id === p.establishment_id) || {};
            const plan = store.plans.find((pl) => pl.id === est.plan_id) || {};
            return {
              ...p,
              establishment_name: est.name,
              establishment_slug: est.slug,
              owner_whatsapp: est.owner_whatsapp,
              plan_name: plan.name,
            };
          });
        return [rows, []];
      }
      if (upper.startsWith("INSERT INTO PAYMENTS")) {
        const id = nextIds.payments++;
        if (upper.includes("SELECT ID, ESTABLISHMENT_ID")) {
          const order = store.orders.find((o) => String(o.id) === String(params[0]));
          if (order) {
            store.payments.push({
              id,
              order_id: order.id,
              establishment_id: order.establishment_id,
              amount: order.total,
              payment_method: "pix",
              status: "paid",
              paid_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });
          }
        } else if (upper.includes("PAYMENT_METHOD, EXTERNAL_ID, CHECKOUT_URL")) {
          const isSubNullOrder = upper.includes("VALUES (NULL");
          if (isSubNullOrder) {
            store.payments.push({
              id,
              order_id: null,
              establishment_id: Number(params[0]),
              amount: Number(params[1]) || 0,
              payment_method: params[2] || "infinitepay",
              external_id: params[3] || null,
              checkout_url: params[4] || null,
              notes: params[5] || null,
              pix_code: null,
              pix_qrcode: null,
              status: "pending",
              paid_at: null,
              created_at: new Date().toISOString(),
            });
          } else {
            store.payments.push({
              id,
              order_id: params[0] !== null && params[0] !== undefined ? Number(params[0]) : null,
              establishment_id: Number(params[1]),
              amount: Number(params[2]) || 0,
              payment_method: params[3] || "infinitepay",
              external_id: params[4] || null,
              checkout_url: params[5] || null,
              notes: params[6] || null,
              pix_code: null,
              pix_qrcode: null,
              status: "pending",
              paid_at: null,
              created_at: new Date().toISOString(),
            });
          }
        } else if (upper.includes("VALUES (NULL")) {
          store.payments.push({
            id,
            order_id: null,
            establishment_id: Number(params[0]),
            amount: Number(params[1]) || 0,
            payment_method: "pix",
            pix_code: params[2],
            pix_qrcode: params[3],
            status: "pending",
            paid_at: null,
            created_at: new Date().toISOString(),
          });
        } else {
          store.payments.push({
            id,
            order_id: Number(params[0]),
            establishment_id: Number(params[1]),
            amount: Number(params[2]) || 0,
            payment_method: "pix",
            status: "paid",
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }
        return [{ insertId: id, affectedRows: 1 }, []];
      }
      if (upper.startsWith("UPDATE PAYMENTS")) {
        if (upper.includes("WHERE ORDER_ID = ?")) {
          const orderId = params[params.length - 1];
          const matching = store.payments.filter(
            (pm) => String(pm.order_id) === String(orderId) && (!upper.includes("PAYMENT_METHOD = 'INFINITEPAY'") || pm.payment_method === "infinitepay")
          );
          for (const p of matching) {
            p.status = "confirmed";
            p.paid_at = new Date().toISOString();
            p.confirmed_by = "infinitepay";
          }
          return [{ affectedRows: matching.length }, []];
        }
        const id = params[params.length - 1];
        const p = store.payments.find((pm) => String(pm.id) === String(id));
        if (p) {
          if (upper.includes("SET CHECKOUT_URL = ?, EXTERNAL_ID = ?")) {
            p.checkout_url = params[0];
            p.external_id = params[1];
          } else if (upper.includes("STATUS = 'CONFIRMED'")) {
            p.status = "confirmed";
            p.paid_at = new Date().toISOString();
            p.confirmed_by = params.length >= 2 ? params[0] : (upper.includes("'INFINITEPAY'") ? "infinitepay" : "superadmin");
          } else if (upper.includes("STATUS = 'REJECTED'")) {
            p.status = "rejected";
            p.notes = params[0];
          }
        }
        return [{ affectedRows: p ? 1 : 0 }, []];
      }
    }

    return [[], []];
  };

  return {
    execute,
    getConnection: async () => ({
      execute,
      release: () => {},
    }),
  };
}
