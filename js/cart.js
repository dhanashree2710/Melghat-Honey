
function requireLoginForCart() {
  if (typeof getSession === "function" && getSession()) return true;
  showLoginRequired();
  return false;
}

function showLoginRequired() {
  let ov = document.getElementById("loginRequiredOverlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "loginRequiredOverlay";
    ov.className = "login-required-overlay";
    ov.innerHTML = `<div class="login-required-box">
      <div style="font-size:2.5rem;color:#f4b400"><i class="fas fa-lock"></i></div>
      <h5 class="mt-2 fw-bold">Login Required</h5>
      <p class="text-muted">Please login or create an account to add products to cart and place orders.</p>
      <a href="login.html" class="btn btn-warning fw-semibold px-4">Login / Sign Up</a>
      <button class="btn btn-link d-block w-100 mt-2 text-muted" onclick="document.getElementById('loginRequiredOverlay').remove()">Continue browsing</button>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
  }
}

let cart = JSON.parse(localStorage.getItem("melghat_cart") || "[]");

function saveCart() {
  localStorage.setItem("melghat_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  }
}

function addToCart(productId, size, quantity, unitPrice) {
  if (!requireLoginForCart()) return;
  const product = getProductById(productId);
  if (!product) return;

  const existing = cart.find(item => item.productId === productId && item.size === size);
  if (existing) {
    existing.quantity += quantity;
    existing.totalPrice = existing.quantity * existing.unitPrice;
  } else {
    cart.push({
      productId,
      name: product.name,
      size,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      image: product.image
    });
  }
  saveCart();
  showToast(`${product.name} (${size}) added to cart!`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCartModal();
}

function updateQty(index, delta) {
  cart[index].quantity = Math.max(1, cart[index].quantity + delta);
  cart[index].totalPrice = cart[index].quantity * cart[index].unitPrice;
  saveCart();
  renderCartModal();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.totalPrice, 0);
}

function showToast(msg) {
  let toast = document.getElementById("toastMsg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastMsg";
    toast.style.cssText = "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#2e7d32;color:#fff;padding:12px 25px;border-radius:50px;z-index:9999;font-weight:600;box-shadow:0 5px 20px rgba(0,0,0,0.2);transition:opacity 0.3s;";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => { toast.style.opacity = "0"; }, 2500);
}

function openCartModal() {
  if (!requireLoginForCart()) return;
  renderCartModal();
  const modal = new bootstrap.Modal(document.getElementById("cartModal"));
  modal.show();
}

function renderCartModal() {
  const body = document.getElementById("cartModalBody");
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `<p class="text-center text-muted py-4">Your cart is empty. Explore our pure forest honey!</p>`;
    return;
  }

  let html = `<div class="table-responsive"><table class="table align-middle">
    <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th></th></tr></thead><tbody>`;

  cart.forEach((item, i) => {
    html += `<tr>
      <td><img src="${item.image}" width="50" height="50" class="rounded me-2" style="object-fit:cover">${item.name}</td>
      <td>${item.size}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary" onclick="updateQty(${i},-1)">-</button>
        <span class="mx-2">${item.quantity}</span>
        <button class="btn btn-sm btn-outline-secondary" onclick="updateQty(${i},1)">+</button>
      </td>
      <td>${formatPrice(item.totalPrice)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeFromCart(${i})"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  });

  html += `</tbody></table></div>
    <div class="d-flex justify-content-between align-items-center mt-3">
      <h5>Total: <span class="text-warning">${formatPrice(getCartTotal())}</span></h5>
      <div>
        <button class="btn btn-outline-secondary me-2" data-bs-dismiss="modal">Continue Shopping</button>
        <a href="https://wa.me/919699544383?text=${encodeURIComponent("Hello Melghat Honey! I want to order:\\n" + cart.map(c => `${c.name} ${c.size} x${c.quantity}`).join("\\n") + "\\nTotal: " + formatPrice(getCartTotal()))}" 
           class="btn btn-success" onclick="placeOrderWhatsApp()"><i class="fab fa-whatsapp me-1"></i> Order via WhatsApp</button>
      </div>
    </div>`;

  body.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", updateCartBadge);