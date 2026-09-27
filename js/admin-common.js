/* Shared admin helpers – include after supabase-config.js */
const PRODUCT_CATEGORIES = ["Everyday", "Festival", "Offer", "Seasonal", "Gym", "Corporate"];

function requireStaff() {
  const session = getSession();
  if (!session || (session.role !== "admin" && session.role !== "staff")) {
    window.location.href = "../login.html";
    return null;
  }
  return session;
}

function isAdmin() {
  const s = getSession();
  return s && s.role === "admin";
}

function renderAdminSidebar(active) {
  const session = getSession() || {};
  const links = [
    { id: "dash", href: "index.html", icon: "fa-tachometer-alt", label: "Dashboard" },
    { id: "products", href: "products.html", icon: "fa-box", label: "Products" },
    { id: "marketing", href: "marketing.html", icon: "fa-images", label: "Marketing" },
    { id: "orders", href: "orders.html", icon: "fa-shopping-bag", label: "Orders" },
    { id: "users", href: "users.html", icon: "fa-users", label: "Users", adminOnly: true },
  ];
  let html = `
    <div class="p-3 text-center">
      <img src="../images/logo.png" alt="Logo" class="admin-logo d-block mx-auto mb-2" style="height:52px">
      <h6 class="text-warning mb-0">Melghat Admin</h6>
      <small class="text-white-50">${session.full_name || ""} · ${session.role || ""}</small>
    </div>`;
  links.forEach(l => {
    if (l.adminOnly && session.role !== "admin") return;
    html += `<a href="${l.href}" class="${active === l.id ? "active" : ""}"><i class="fas ${l.icon} me-2"></i>${l.label}</a>`;
  });
  html += `
    <a href="../index.html"><i class="fas fa-store me-2"></i>View Store</a>
    <a href="#" onclick="logoutUser();return false;"><i class="fas fa-sign-out-alt me-2"></i>Logout</a>`;
  const el = document.getElementById("adminSidebar");
  if (el) el.innerHTML = html;
}

function statusBadge(st) {
  const map = {
    pending: "secondary", confirmed: "primary", packed: "info",
    shipped: "warning", out_for_delivery: "warning", delivered: "success",
    cancelled: "danger", returned: "dark"
  };
  return `<span class="badge bg-${map[st] || "secondary"}">${st}</span>`;
}
