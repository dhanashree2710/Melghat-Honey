/* Products from Supabase */
let products = [];
let productRows = [];

async function loadStoreProducts() {
  try {
    productRows = await fetchProducts(true);
    products = groupProducts(productRows).map((g, i) => ({
      id: i + 1,
      name: g.name,
      short_desc: g.short_desc || "",
      description: g.description || "",
      category: g.category || g.badge || "Everyday",
      badge: g.badge || g.category || "",
      image: g.image || "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800",
      sizes: g.sizes,
      variants: g.variants,
      minPrice: Math.min(...Object.values(g.sizes)),
      maxPrice: Math.max(...Object.values(g.sizes)),
      is_featured: g.is_featured
    }));
  } catch (e) {
    console.warn("Product load failed", e);
    products = [];
  }
  return products;
}

function getProductById(id) {
  return products.find(p => p.id === parseInt(id));
}

function searchProducts(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return products;
  return products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.short_desc || "").toLowerCase().includes(q) ||
    (p.category || "").toLowerCase().includes(q) ||
    (p.badge || "").toLowerCase().includes(q)
  );
}

function filterProducts({ category, minPrice, maxPrice, query, sort }) {
  let list = products.slice();
  if (query) list = searchProducts(query);
  if (category && category !== "All") {
    list = list.filter(p => (p.category || "") === category);
  }
  if (minPrice != null && minPrice !== "") {
    list = list.filter(p => p.minPrice >= Number(minPrice));
  }
  if (maxPrice != null && maxPrice !== "") {
    list = list.filter(p => p.minPrice <= Number(maxPrice));
  }
  if (sort === "price_asc") list.sort((a, b) => a.minPrice - b.minPrice);
  else if (sort === "price_desc") list.sort((a, b) => b.minPrice - a.minPrice);
  else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function getRecommended(excludeName, limit = 4) {
  const others = products.filter(p => p.name !== excludeName);
  // prefer same category first
  return others.sort(() => Math.random() - 0.5).slice(0, limit);
}

function getFeaturedForCarousel(limit = 6) {
  const featured = productRows.filter(r => r.is_featured && r.is_active && r.image_url);
  if (featured.length) return featured.slice(0, limit);
  return productRows.filter(r => r.image_url).slice(0, limit);
}

/* Pick the best image for a product (DB image_url preferred) */
function pickProductImage(p) {
  // Prefer the real image coming from Supabase
  if (p.image && typeof p.image === "string" && p.image.trim() !== "") {
    return p.image;
  }
  if (p.image_url && typeof p.image_url === "string" && p.image_url.trim() !== "") {
    return p.image_url;
  }
  // Fallback
  return "images/melghat-pure-wild.png";
}
