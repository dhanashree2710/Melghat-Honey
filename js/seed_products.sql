-- Sample seed data for public.products
-- Run after creating the table. Adjust prices / stock as needed.
-- image_url points to the cleaned filenames in /images/

INSERT INTO public.products (
  name, slug, description, short_desc, size, price, mrp, stock, sku,
  is_active, is_featured, badge, image_url, category
) VALUES
(
  'Melghat Pure Wild Forest Honey',
  'melghat-pure-wild-forest-honey',
  '100% pure wild forest honey harvested by tribal communities deep inside Melghat Tiger Reserve. Unprocessed, enzyme-rich, no chemicals.',
  '100% pure raw forest honey from Melghat Tiger Reserve. Tribal harvested.',
  '500g', 549.00, 649.00, 120, 'MH-WILD-500',
  true, true, 'Bestseller', 'images/melghat-pure-wild.png', 'Everyday'
),
(
  'Acacia Honey',
  'acacia-honey',
  'Light, mild and pure Acacia honey. 100% natural, pure & raw. Ideal for daily use and children.',
  'Light · Mild · Naturally Pure Acacia honey.',
  '500g', 629.00, 749.00, 80, 'MH-ACA-500',
  true, true, 'Premium', 'images/raw7-acacia.png', 'Everyday'
),
(
  'Lychee Honey',
  'lychee-honey',
  'Delicate floral notes of lychee blossom. Pure & natural honey collected during the lychee flowering season.',
  'Delicate floral notes of lychee blossom. Pure & natural.',
  '500g', 599.00, 699.00, 90, 'MH-LYC-500',
  true, true, 'Seasonal', 'images/melgaht-lychee.png', 'Seasonal'
),
(
  'Multifloral Honey',
  'multifloral-honey',
  'Rich, aromatic multifloral honey collected from the wild flowers of Melghat forests.',
  'Rich, aromatic multifloral honey from wild flowers of Melghat.',
  '500g', 579.00, 679.00, 100, 'MH-MUL-500',
  true, true, null, 'images/kshetra-multifloral.png', 'Everyday'
),
(
  'Coriander (Dhaniya) Honey',
  'coriander-dhaniya-honey',
  'Unique herbal notes of coriander blossom. Pure goodness from nature, made by bees.',
  'Unique herbal notes of coriander blossom. Pure goodness from nature.',
  '500g', 619.00, 729.00, 60, 'MH-COR-500',
  true, false, 'Herbal', 'images/raw7-coriander.png', 'Seasonal'
),
(
  'Wildflower Honey',
  'wildflower-honey',
  'Classic wildflower honey — light, pure and naturally sweet. Perfect for everyday use.',
  'Classic wildflower honey — light, pure and naturally sweet.',
  '500g', 549.00, 649.00, 150, 'MH-WF-500',
  true, false, null, 'images/melgaht-wildflower.png', 'Everyday'
),
(
  'Longan Honey',
  'longan-honey',
  'Pure & natural Longan honey with a distinctive fruity aroma. Harvested from longan orchards.',
  'Pure & natural Longan honey with distinctive fruity aroma.',
  '500g', 649.00, 749.00, 50, 'MH-LON-500',
  true, false, 'Limited', 'images/melgaht-longan.png', 'Seasonal'
),
(
  'Coffee Honey',
  'coffee-honey',
  'Artisanal coffee blossom honey. Subtle coffee notes blended by nature. Pure & raw.',
  'Artisanal coffee blossom honey. Subtle coffee notes.',
  '500g', 699.00, 799.00, 40, 'MH-COF-500',
  true, false, 'Artisanal', 'images/melgaht-coffee.png', 'Seasonal'
),
(
  'Neem Honey',
  'neem-honey',
  'Neem honey known for its traditional wellness benefits. Kshetra Nature''s Best.',
  'Neem honey for traditional wellness. Pure & natural.',
  '450g', 599.00, 699.00, 70, 'MH-NEE-450',
  true, false, 'Herbal', 'images/kshetra-neem.png', 'Everyday'
),
(
  'Wild Kombu Honey',
  'wild-kombu-honey',
  'Rare wild kombu honey with unique coastal forest character. Limited harvest.',
  'Rare wild kombu honey. Limited harvest.',
  '450g', 749.00, 899.00, 25, 'MH-KOM-450',
  true, true, 'Rare', 'images/kshetra-kombu.png', 'Offer'
),
(
  'Melghat Forest Honey 250g',
  'melghat-forest-honey-250g',
  'Starter size of our signature Melghat forest honey. Perfect for first-time buyers and gifting.',
  'Signature Melghat forest honey — starter size.',
  '250g', 299.00, 349.00, 200, 'MH-WILD-250',
  true, false, null, 'images/melghat-pure-wild.png', 'Everyday'
),
(
  'Gym / Fitness Honey Pack',
  'gym-fitness-honey',
  'Natural energy boost for workouts. Pure raw honey preferred by fitness enthusiasts.',
  'Natural energy boost for workouts. Pure raw honey.',
  '500g', 579.00, 679.00, 80, 'MH-GYM-500',
  true, true, 'Fitness', 'images/model-gym.png', 'Gym'
);

-- Optional: also create 1kg variants by duplicating with different size/price if needed
-- Example:
-- INSERT INTO public.products (name, slug, ..., size, price, ...) 
-- SELECT name || ' 1kg', slug || '-1kg', ..., '1kg', price * 1.8, ... FROM public.products WHERE size = '500g';
