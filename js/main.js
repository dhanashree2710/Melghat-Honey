document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Fade-in on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));

  // Active nav link
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === path) {
      link.classList.add("active");
    }
  });
});

// ==================== ADD TO CART MODAL ====================
let currentProduct = null;
let currentSize = "";
let currentQty = 1;

function openAddModal(productId) {
  // Check login if the function exists
  if (typeof requireLoginForCart === "function" && !requireLoginForCart()) {
    return;
  }

  // Get product
  if (typeof getProductById !== "function") {
    console.error("getProductById is not defined");
    alert("Product system not loaded. Please refresh the page.");
    return;
  }

  currentProduct = getProductById(productId);

  // Fallback: try finding by string id (for AI / fallback products)
  if (!currentProduct && typeof products !== "undefined") {
    currentProduct = products.find(p => String(p.id) === String(productId));
  }

  if (!currentProduct) {
    console.warn("Product not found:", productId);
    alert("Product not found. Please try again.");
    return;
  }

  // Safety: ensure sizes object exists
  if (!currentProduct.sizes || Object.keys(currentProduct.sizes).length === 0) {
    currentProduct.sizes = { "500g": currentProduct.price || currentProduct.minPrice || 499 };
  }

  currentSize = Object.keys(currentProduct.sizes)[0];
  currentQty = 1;

  // Fill modal
  const nameEl = document.getElementById("modalProductName");
  const imgEl = document.getElementById("modalProductImg");
  const qtyEl = document.getElementById("modalQty");
  const sizeSelect = document.getElementById("modalSizeSelect");

  if (nameEl) nameEl.textContent = currentProduct.name || "Melghat Honey";
  if (imgEl) imgEl.src = currentProduct.image || currentProduct.image_url || "images/melghat-pure-wild.png";
  if (qtyEl) qtyEl.textContent = currentQty;

  if (sizeSelect) {
    sizeSelect.innerHTML = "";
    for (const [size, price] of Object.entries(currentProduct.sizes)) {
      const opt = document.createElement("option");
      opt.value = size;
      opt.textContent = `${size} - ${typeof formatPrice === "function" ? formatPrice(price) : "₹" + price}`;
      sizeSelect.appendChild(opt);
    }
  }

  updateModalTotal();

  const modalEl = document.getElementById("addToCartModal");
  if (modalEl && typeof bootstrap !== "undefined") {
    new bootstrap.Modal(modalEl).show();
  }
}

function changeModalSize() {
  const select = document.getElementById("modalSizeSelect");
  if (select) currentSize = select.value;
  updateModalTotal();
}

function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  const qtyEl = document.getElementById("modalQty");
  if (qtyEl) qtyEl.textContent = currentQty;
  updateModalTotal();
}

function updateModalTotal() {
  if (!currentProduct || !currentProduct.sizes) return;

  const unit = currentProduct.sizes[currentSize] || 0;
  const total = unit * currentQty;

  const totalEl = document.getElementById("modalTotal");
  if (totalEl) {
    totalEl.textContent = typeof formatPrice === "function" ? formatPrice(total) : "₹" + total;
  }
}

function confirmAddToCart() {
  if (!currentProduct) return;

  const unit = currentProduct.sizes[currentSize] || 0;

  if (typeof addToCart === "function") {
    addToCart(currentProduct.id, currentSize, currentQty, unit);
  } else {
    console.error("addToCart function not found");
    alert("Cart system not loaded.");
  }

  const modalEl = document.getElementById("addToCartModal");
  if (modalEl && typeof bootstrap !== "undefined") {
    const instance = bootstrap.Modal.getInstance(modalEl);
    if (instance) instance.hide();
  }
}

// ==================== WHATSAPP ====================
function openBulkWhatsApp(productName = "", size = "", qty = "") {
  let msg = "Hello, I want to place a bulk order for Melghat Honey.";
  if (productName) msg += ` Product: ${productName}`;
  if (size) msg += ` Size: ${size}`;
  if (qty) msg += ` Quantity: ${qty}`;
  window.open(`https://wa.me/919699544383?text=${encodeURIComponent(msg)}`, "_blank");
}

// ==================== CONTACT FORM ====================
function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById("contactName")?.value.trim();
  const phone = document.getElementById("contactPhone")?.value.trim();
  const message = document.getElementById("contactMessage")?.value.trim();

  if (!name || !phone || !message) {
    alert("Please fill all required fields.");
    return;
  }

  const waMsg = `Contact Form Submission%0AName: ${name}%0APhone: ${phone}%0AMessage: ${message}`;
  window.open(`https://wa.me/919699544383?text=${waMsg}`, "_blank");
  alert("Thank you! We'll contact you shortly via WhatsApp.");
  e.target.reset();
}

// ==================== BULK ORDER FORM ====================
async function submitBulk(e) {
  e.preventDefault();
  const name = document.getElementById("bulkName")?.value.trim();
  const phone = document.getElementById("bulkPhone")?.value.trim();
  const email = document.getElementById("bulkEmail")?.value.trim();
  const company = document.getElementById("bulkCompany")?.value.trim();
  const product = document.getElementById("bulkProduct")?.value;
  const qty = document.getElementById("bulkQty")?.value;
  const msg = document.getElementById("bulkMsg")?.value.trim();

  if (!name || !phone || !product || !qty) {
    alert("Please fill required fields marked *");
    return;
  }

  try {
    if (typeof createBulkOrder === "function") {
      await createBulkOrder({ name, phone, email, company, product, qty, message: msg });
    }
  } catch (err) {
    console.warn("Bulk DB save:", err);
  }

  let text = `Bulk Order Request%0AName: ${name}%0APhone: ${phone}`;
  if (email) text += `%0AEmail: ${email}`;
  if (company) text += `%0ACompany: ${company}`;
  text += `%0AProduct: ${product}%0AQuantity: ${qty}`;
  if (msg) text += `%0AMessage: ${msg}`;

  window.open(`https://wa.me/919699544383?text=${text}`, "_blank");
  alert("Bulk order saved & WhatsApp opened. Admin/Staff can see it in Orders.");
  e.target.reset();
}

// ==================== SEARCH ====================
function toggleHeaderSearch(e) {
  e.preventDefault();
  const box = document.getElementById("headerSearch");
  if (!box) return;
  box.classList.toggle("open");
  if (box.classList.contains("open")) {
    document.getElementById("globalSearchInput")?.focus();
  }
}

function goSearch() {
  const q = document.getElementById("globalSearchInput")?.value?.trim() || "";
  if (!q) return;
  window.location.href = "products.html?q=" + encodeURIComponent(q);
}