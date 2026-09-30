/* Melghat Honey – Checkout pricing & order placement (Flipkart-style flow) */

const GST_RATE = 0.05;
const FREE_SHIP_MIN = 499;
const SHIPPING_FEE = 49;

function isUuid(v) {
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function getCheckoutItems() {
  try {
    const buyNow = JSON.parse(sessionStorage.getItem("melghat_buynow") || "null");
    if (buyNow && buyNow.length) return buyNow;
  } catch (e) {}
  return typeof cart !== "undefined" ? cart : JSON.parse(localStorage.getItem("melghat_cart") || "[]");
}

function isBuyNowMode() {
  try {
    const buyNow = JSON.parse(sessionStorage.getItem("melghat_buynow") || "null");
    return !!(buyNow && buyNow.length);
  } catch (e) {
    return false;
  }
}

function calcTotals(items, discount = 0) {
  const subtotal = items.reduce((s, it) => s + Number(it.totalPrice || it.unitPrice * it.quantity || 0), 0);
  const disc = Math.min(Number(discount) || 0, subtotal);
  const taxable = Math.max(0, subtotal - disc);
  const gst = Math.round(taxable * GST_RATE * 100) / 100;
  const shipping = taxable >= FREE_SHIP_MIN || taxable === 0 ? 0 : SHIPPING_FEE;
  const grand = Math.round((taxable + gst + shipping) * 100) / 100;
  return { subtotal, discount: disc, gst, shipping, grand };
}

function goToCheckout() {
  if (typeof requireLoginForCart === "function" && !requireLoginForCart()) return;
  const items = typeof cart !== "undefined" ? cart : [];
  if (!items.length) {
    if (typeof showToast === "function") showToast("Your cart is empty");
    else alert("Your cart is empty");
    return;
  }
  sessionStorage.removeItem("melghat_buynow");
  window.location.href = "checkout.html";
}

function buyNowFromModal() {
  if (typeof requireLoginForCart === "function" && !requireLoginForCart()) return;
  if (typeof currentProduct === "undefined" || !currentProduct) {
    alert("Product not found");
    return;
  }
  const size = typeof currentSize !== "undefined" ? currentSize : Object.keys(currentProduct.sizes || {})[0];
  const qty = typeof currentQty !== "undefined" ? currentQty : 1;
  const unit = currentProduct.sizes ? currentProduct.sizes[size] : (currentProduct.price || currentProduct.minPrice || 0);
  const item = {
    productId: currentProduct.id,
    name: currentProduct.name,
    size: size,
    quantity: qty,
    unitPrice: unit,
    totalPrice: qty * unit,
    image: currentProduct.image || currentProduct.image_url || ""
  };
  sessionStorage.setItem("melghat_buynow", JSON.stringify([item]));
  const modalEl = document.getElementById("addToCartModal");
  if (modalEl && typeof bootstrap !== "undefined") {
    const inst = bootstrap.Modal.getInstance(modalEl);
    if (inst) inst.hide();
  }
  window.location.href = "checkout.html";
}

function placeOrderWhatsApp() {
  if (typeof requireLoginForCart === "function" && !requireLoginForCart()) return;
  const items = typeof cart !== "undefined" ? cart : [];
  if (!items.length) {
    if (typeof showToast === "function") showToast("Cart is empty");
    return;
  }
  const totals = calcTotals(items);
  let msg = "Hello Melghat Honey! I want to place an order:\n\n";
  items.forEach(c => {
    msg += `• ${c.name} (${c.size}) x${c.quantity} = ${formatPrice(c.totalPrice)}\n`;
  });
  msg += `\nSubtotal: ${formatPrice(totals.subtotal)}`;
  msg += `\nGST (5%): ${formatPrice(totals.gst)}`;
  msg += `\nDelivery: ${totals.shipping ? formatPrice(totals.shipping) : "FREE"}`;
  msg += `\nGrand Total: ${formatPrice(totals.grand)}`;
  window.open(`https://wa.me/919699544383?text=${encodeURIComponent(msg)}`, "_blank");
}

async function placeOrderFromCheckout(formData) {
  const items = getCheckoutItems();
  if (!items.length) throw new Error("No items to order");

  const session = typeof getSession === "function" ? getSession() : null;
  const discount = Number(formData.discount) || 0;
  const totals = calcTotals(items, discount);

  const orderNumber = typeof generateOrderNumber === "function" ? generateOrderNumber() : "MH-" + Date.now();

  const order = {
    order_number: orderNumber,
    user_id: session ? session.id : null,
    customer_name: formData.name,
    customer_email: formData.email || (session ? session.email : null),
    customer_phone: formData.phone,
    shipping_address: formData.address,
    city: formData.city || null,
    state: formData.state || null,
    pincode: formData.pincode || null,
    subtotal: totals.subtotal,
    shipping_charge: totals.shipping,
    discount: totals.discount,
    total_amount: totals.grand,
    payment_method: formData.payment_method || "cod",
    payment_status: "pending",
    order_status: "pending",
    notes: formData.notes || null
  };

  // product_id must be UUID or null — never numeric ids like 3
  const orderItems = items.map(it => {
    const raw = it.productId ?? it.product_id ?? null;
    const pid = isUuid(String(raw)) ? String(raw) : null;
    return {
      product_id: pid,
      product_name: it.name,
      product_size: it.size || null,
      quantity: Number(it.quantity) || 1,
      unit_price: Number(it.unitPrice) || 0,
      total_price: Number(it.totalPrice) || 0
    };
  });

  let saved = null;
  if (typeof createOrder === "function") {
    saved = await createOrder(order, orderItems);
  }

  if (!isBuyNowMode() && typeof cart !== "undefined") {
    cart.length = 0;
    if (typeof saveCart === "function") saveCart();
  }
  sessionStorage.removeItem("melghat_buynow");
  sessionStorage.setItem("melghat_last_order", JSON.stringify({
    order_number: orderNumber,
    total: totals.grand,
    payment_method: order.payment_method,
    id: saved ? saved.id : null
  }));

  return { orderNumber, totals, saved };
}