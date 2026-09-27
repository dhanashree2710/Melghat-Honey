const SUPABASE_URL = "https://dmehkoxuczhfhnjinniy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZWhrb3h1Y3poZmhuamlubml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzOTk4MDQsImV4cCI6MjEwNTk3NTgwNH0.zhwnWx3i5Mzg0esYBci07jGuvv2wnGRDLzZIaOAbLgc";

const sbHeaders = () => ({
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
});

async function sbGet(table, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: sbHeaders()
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbPatch(table, matchQuery, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${matchQuery}`, {
    method: "PATCH",
    headers: sbHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbDelete(table, matchQuery) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${matchQuery}`, {
    method: "DELETE",
    headers: { ...sbHeaders(), "Prefer": "return=minimal" }
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

/* ---------- Auth (custom users table) ---------- */
const SESSION_KEY = "melghat_session";

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch { return null; }
}

function setSession(user) {
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    phone: user.phone || null
  }));
}

function isLoggedIn() {
  return !!getSession();
}

function isStaffOrAdmin() {
  const s = getSession();
  return s && (s.role === "admin" || s.role === "staff");
}

async function loginUser(email, password) {
  const rows = await sbGet("users", `email=eq.${encodeURIComponent(email.trim().toLowerCase())}&is_active=eq.true&select=*`);
  if (!rows.length) throw new Error("No account found with this email.");
  const user = rows[0];
  if (user.password_hash !== password) throw new Error("Incorrect password.");
  setSession(user);
  return user;
}

async function signupUser({ full_name, email, phone, password }) {
  email = email.trim().toLowerCase();
  const existing = await sbGet("users", `email=eq.${encodeURIComponent(email)}&select=id`);
  if (existing.length) throw new Error("An account with this email already exists.");
  const rows = await sbPost("users", {
    full_name: full_name.trim(),
    email,
    phone: phone || null,
    password_hash: password,
    role: "customer",
    is_active: true
  });
  const user = rows[0];
  setSession(user);
  return user;
}

/** Admin-only: create user with chosen role (does not log them in) */
async function adminCreateUser({ full_name, email, phone, password, role }) {
  email = (email || "").trim().toLowerCase();
  if (!full_name || !email || !password) throw new Error("Name, email and password are required.");
  const allowed = ["customer", "staff", "admin"];
  role = allowed.includes(role) ? role : "customer";
  const existing = await sbGet("users", `email=eq.${encodeURIComponent(email)}&select=id`);
  if (existing.length) throw new Error("An account with this email already exists.");
  const rows = await sbPost("users", {
    full_name: full_name.trim(),
    email,
    phone: phone ? phone.trim() : null,
    password_hash: password,
    role,
    is_active: true
  });
  return rows[0];
}

async function resetPassword(email, newPassword) {
  email = email.trim().toLowerCase();
  const rows = await sbGet("users", `email=eq.${encodeURIComponent(email)}&select=id`);
  if (!rows.length) throw new Error("No account found with this email.");
  await sbPatch("users", `email=eq.${encodeURIComponent(email)}`, {
    password_hash: newPassword,
    updated_at: new Date().toISOString()
  });
  return true;
}

function logoutUser() {
  setSession(null);
  // Always return to the main storefront after logout
  if (window.location.pathname.includes("/admin/")) {
    window.location.href = "../index.html";
  } else {
    window.location.href = "index.html";
  }
}

/* ---------- Products ---------- */
async function fetchProducts(activeOnly = true) {
  let q = "select=*&order=name.asc,size.asc";
  if (activeOnly) q = "is_active=eq.true&" + q;
  return sbGet("products", q);
}

/** Group DB rows (one size per row) into product cards with sizes map */
function groupProducts(rows) {
  const map = {};
  rows.forEach(r => {
    const cat = r.category || r.badge || "Everyday";
    const key = r.name + "||" + cat;
    if (!map[key]) {
      map[key] = {
        name: r.name,
        short_desc: r.short_desc,
        description: r.description,
        category: cat,
        badge: r.badge || cat,
        image: r.image_url,
        is_featured: r.is_featured,
        sizes: {},
        variants: []
      };
    }
    map[key].sizes[r.size] = Number(r.price);
    map[key].variants.push(r);
    if (r.image_url && !map[key].image) map[key].image = r.image_url;
  });
  return Object.values(map);
}

async function fetchFeaturedForCarousel() {
  const rows = await sbGet("products", "is_active=eq.true&is_featured=eq.true&select=name,image_url,short_desc,category,badge&order=created_at.desc");
  // unique by image
  const seen = new Set();
  const slides = [];
  for (const r of rows) {
    if (!r.image_url || seen.has(r.image_url)) continue;
    seen.add(r.image_url);
    slides.push({
      image: r.image_url,
      title: r.name,
      subtitle: r.short_desc || (r.category || r.badge || ""),
      category: r.category || r.badge
    });
    if (slides.length >= 8) break;
  }
  return slides;
}

async function createProduct(data) {
  return sbPost("products", data);
}

async function updateProduct(id, data) {
  return sbPatch("products", `id=eq.${id}`, { ...data, updated_at: new Date().toISOString() });
}

async function deleteProduct(id) {
  return sbDelete("products", `id=eq.${id}`);
}

/* ---------- Orders ---------- */
async function fetchOrders() {
  return sbGet("orders", "select=*&order=created_at.desc");
}

async function createOrder(order, items) {
  const orderRows = await sbPost("orders", order);
  const orderId = orderRows[0].id;
  const itemPayload = items.map(it => ({
    order_id: orderId,
    product_id: it.product_id || null,
    product_name: it.product_name,
    product_size: it.product_size,
    quantity: it.quantity,
    unit_price: it.unit_price,
    total_price: it.total_price
  }));
  if (itemPayload.length) await sbPost("order_items", itemPayload);
  return orderRows[0];
}

async function updateOrderStatus(id, order_status) {
  return sbPatch("orders", `id=eq.${id}`, { order_status, updated_at: new Date().toISOString() });
}

/* ---------- Users (admin) ---------- */
async function fetchUsers() {
  return sbGet("users", "select=id,full_name,email,phone,role,is_active,created_at&order=created_at.desc");
}

function formatPrice(price) {
  return "₹" + Number(price).toLocaleString("en-IN");
}

function generateOrderNumber() {
  const d = new Date();
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `MH-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${n}`;
}


async function fetchMarketingImages() {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/marketing-images`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prefix: "", limit: 50, offset: 0, sortBy: { column: "created_at", order: "desc" } })
    });
    if (!res.ok) throw new Error(await res.text());
    const files = await res.json();
    return (files || [])
      .filter(f => f.name && !f.name.endsWith("/") && (f.metadata?.mimetype || "").startsWith("image") || /\.(png|jpe?g|webp|gif)$/i.test(f.name))
      .map(f => ({
        name: f.name,
        url: `${SUPABASE_URL}/storage/v1/object/public/marketing-images/${f.name}`,
        created_at: f.created_at
      }));
  } catch (e) {
    console.warn("Marketing images:", e);
    return [];
  }
}

async function createBulkOrder(data) {
  const session = getSession();
  const order = {
    order_number: "BH-" + generateOrderNumber().replace("MH-", ""),
    user_id: session ? session.id : null,
    customer_name: data.name,
    customer_email: data.email || (session ? session.email : null),
    customer_phone: data.phone,
    shipping_address: data.company ? `Bulk · ${data.company}` : "Bulk order enquiry",
    city: null,
    state: null,
    pincode: null,
    subtotal: 0,
    shipping_charge: 0,
    discount: 0,
    total_amount: 0,
    payment_method: "cod",
    payment_status: "pending",
    order_status: "pending",
    notes: `BULK ORDER | Product: ${data.product} | Qty: ${data.qty} | ${data.message || ""}`
  };
  return createOrder(order, [{
    product_name: data.product || "Bulk enquiry",
    product_size: null,
    quantity: Math.max(1, parseInt(data.qty, 10) || 1),
    unit_price: 0,
    total_price: 0
  }]);
}
