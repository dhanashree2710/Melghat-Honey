/* Melghat Honey – Profile icon + dropdown when customer is logged in */

function updateAuthUI() {
  const session = typeof getSession === "function" ? getSession() : null;
  const loginBtn = document.querySelector(".nav-icon-login");
  if (!loginBtn) return;

  // Remove any existing profile dropdown
  document.getElementById("profileDropdownWrap")?.remove();

  if (!session || !session.id) {
    // Guest – show login icon
    loginBtn.style.display = "";
    loginBtn.href = "login.html";
    loginBtn.title = "Login / Account";
    loginBtn.innerHTML = '<i class="fas fa-user-circle"></i>';
    loginBtn.onclick = null;
    return;
  }

  // Logged in – hide plain login icon, show profile
  loginBtn.style.display = "none";

  const wrap = document.createElement("div");
  wrap.id = "profileDropdownWrap";
  wrap.className = "profile-dropdown-wrap";

  const initial = (session.full_name || session.email || "U").charAt(0).toUpperCase();

  wrap.innerHTML = `
    <button type="button" class="profile-btn" id="profileBtn" title="${session.full_name || "My Account"}">
      <span class="profile-avatar">${initial}</span>
    </button>
    <div class="profile-menu" id="profileMenu">
      <div class="profile-menu-header">
        <div class="profile-avatar lg">${initial}</div>
        <div>
          <div class="profile-name">${session.full_name || "Customer"}</div>
          <div class="profile-email">${session.email || ""}</div>
        </div>
      </div>
      <div class="profile-menu-body">
        ${session.phone ? `<div class="profile-row"><i class="fas fa-phone"></i> ${session.phone}</div>` : ""}
        <div class="profile-row"><i class="fas fa-user-tag"></i> ${session.role === "customer" ? "Customer" : session.role}</div>
      </div>
      <div class="profile-menu-actions">
        <a href="my-orders.html" class="profile-action"><i class="fas fa-box"></i> My Orders</a>
        ${session.role === "admin" || session.role === "staff"
          ? `<a href="admin/index.html" class="profile-action"><i class="fas fa-cog"></i> Admin Panel</a>`
          : ""}
        <button type="button" class="profile-action logout" onclick="handleLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  `;

  // Insert after cart icon or before Shop Now
  const cartIcon = document.querySelector(".nav-icon-cart");
  const parent = loginBtn.parentElement;
  if (cartIcon && cartIcon.nextSibling) {
    parent.insertBefore(wrap, cartIcon.nextSibling);
  } else {
    parent.insertBefore(wrap, loginBtn);
  }

  // Toggle menu
  const btn = document.getElementById("profileBtn");
  const menu = document.getElementById("profileMenu");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) menu.classList.remove("show");
  });
}

function handleLogout() {
  if (typeof showToast === "function") {
    showToast("Logged out successfully. See you soon!", "success");
  }
  // Clear session then always go to home
  setTimeout(() => {
    try {
      if (typeof setSession === "function") setSession(null);
      else localStorage.removeItem("melghat_session");
    } catch (e) {}
    window.location.href = "index.html";
  }, 500);
}

/* ---------- Nice Toast / Alert ---------- */
function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `honey-toast ${type}`;
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    info: "fa-info-circle",
    warn: "fa-exclamation-triangle"
  };
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
    <button type="button" class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
});
