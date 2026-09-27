/**
 * Image helpers: resize, compress, optional Supabase Storage upload
 * Buckets (create in Supabase Dashboard → Storage as PUBLIC):
 *   - product-images
 *   - marketing-images
 */
const STORAGE_PRODUCT = "product-images";
const STORAGE_MARKETING = "marketing-images";

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Resize image to maxWidth, return JPEG data URL */
function resizeImageFile(file, maxWidth = 900, quality = 0.75) {
  return new Promise(async (resolve, reject) => {
    try {
      const dataUrl = await readFileAsDataURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = dataUrl;
    } catch (e) { reject(e); }
  });
}

async function uploadToSupabaseStorage(bucket, file, pathPrefix = "") {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${pathPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "image/jpeg",
      "x-upsert": "true"
    },
    body: file
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Storage upload failed");
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Process selected file: try Storage first, fallback to compressed data URL
 */
async function processImageUpload(file, bucket = STORAGE_PRODUCT) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Please select an image file (JPG, PNG, WebP)");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image too large (max 8 MB)");
  }
  // Try Supabase Storage
  try {
    const url = await uploadToSupabaseStorage(bucket, file, "");
    return { url, source: "storage" };
  } catch (e) {
    console.warn("Storage unavailable, using compressed data URL:", e.message);
    const dataUrl = await resizeImageFile(file, 800, 0.72);
    // Guard against huge base64 in DB
    if (dataUrl.length > 400000) {
      const smaller = await resizeImageFile(file, 500, 0.6);
      return { url: smaller, source: "dataurl" };
    }
    return { url: dataUrl, source: "dataurl" };
  }
}

/* ---------- Marketing banners (localStorage + optional future DB) ---------- */
const BANNERS_KEY = "melghat_banners";

function getBanners() {
  try {
    return JSON.parse(localStorage.getItem(BANNERS_KEY) || "[]");
  } catch { return []; }
}

function saveBanners(list) {
  localStorage.setItem(BANNERS_KEY, JSON.stringify(list));
}

function addBanner(item) {
  const list = getBanners();
  list.unshift({ id: Date.now().toString(), ...item, created_at: new Date().toISOString() });
  saveBanners(list);
  return list;
}

function removeBanner(id) {
  const list = getBanners().filter(b => b.id !== id);
  saveBanners(list);
  return list;
}
