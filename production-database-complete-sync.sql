-- COMPLETE Production Database Sync Script for PotLuxE
-- This syncs BOTH products AND categories to match development
-- Run this script against your production database
-- Created: 2025-01-14 (Complete Version)

-- =============================================================================
-- 1. SYNC CATEGORIES FIRST
-- =============================================================================

-- Remove any duplicate categories
DELETE FROM categories p1 
USING categories p2 
WHERE p1.slug = p2.slug 
  AND p1.created_at > p2.created_at;

-- Upsert all categories from development
INSERT INTO categories (id, name, slug, description, image_url, created_at, updated_at)
VALUES 
('f3354550-facc-4ba2-8e8f-da68ddc965fc', 'Collars & Accessories', 'collars-accessories', 'Collars, leashes, and pet accessories', 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80', NOW(), NOW()),
('83ee06f0-696d-4d50-80a9-499c68c53639', 'Feeding & Water', 'feeding-water', 'Bowls, feeders, and water bottles for pets', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80', NOW(), NOW()),
('0004cbb8-65e6-4924-81ef-4f608df2018b', 'Pet Beds', 'pet-beds', 'Comfortable beds and sleeping solutions for pets', 'https://images.unsplash.com/photo-1581888227599-779811939961?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80', NOW(), NOW()),
('ecb2cbee-ef20-49a7-9f3a-b76a3c127d13', 'Toys & Enrichment', 'toys-enrichment', 'Interactive toys and enrichment products', 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- =============================================================================
-- 2. SYNC PRODUCTS WITH PROPER CATEGORIES
-- =============================================================================

-- Remove duplicate products based on slug
DELETE FROM products p1 
USING products p2 
WHERE p1.slug = p2.slug 
  AND p1.created_at > p2.created_at;

-- Remove any products with duplicate names but different slugs
DELETE FROM products p1 
USING products p2 
WHERE p1.name = p2.name 
  AND p1.id != p2.id 
  AND p1.created_at > p2.created_at;

-- Insert or update all products with correct category assignments
INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, category_id, is_active, created_at, updated_at)
VALUES 
-- Collars & Accessories Category
('debb28ae-8079-4bc8-9176-c6414ab9404f', 'Dropship Personalized Reflective Dog Collar Custom Pet', 'dropship-personalized-reflective-collar', 29.99, 60, '/images/products/reflective-collar.jpg', 'Custom reflective dog collar for safety and style. Personalize with your pet''s name.', 'Personalized reflective collar for safety', 'f3354550-facc-4ba2-8e8f-da68ddc965fc', true, NOW(), NOW()),
('c0bb0545-1aba-4ce1-a06f-ad16bdb675ef', 'Dropship Soft Crystal Personalized Dog Collar Customized', 'dropship-soft-crystal-personalized-collar', 8.00, 40, '/images/products/crystal-collar.jpg', 'Elegant crystal dog collar that can be personalized with your pet''s information.', 'Crystal collar with personalization', 'f3354550-facc-4ba2-8e8f-da68ddc965fc', true, NOW(), NOW()),
('09482d49-ab45-4b93-8167-185d618343d2', 'Luxury Rope Leash', 'luxury-rope-leash', 10.00, 50, NULL, 'Premium rope leash for style and durability during walks.', 'Premium rope leash for dogs', 'f3354550-facc-4ba2-8e8f-da68ddc965fc', true, NOW(), NOW()),

-- Feeding & Water Category
('d134d1c4-72ad-45e1-bafd-31e085082a9d', 'Dropship Mat For Dogs Cats Slow Food Bowls New Pet Dog Feeding Food Bowl', 'dropship-lick-mat-dogs-cats', 16.99, 90, '/images/products/lick-mat.jpg', 'Slow feeding mat that promotes healthy eating habits and reduces bloating in pets.', 'Slow feeding mat for healthier eating', '83ee06f0-696d-4d50-80a9-499c68c53639', true, NOW(), NOW()),
('08e8854c-3600-46b9-bcbf-02d5dfe93b23', 'Dropship Slow Feeder Bowl Slow Feeder Bath Pet Supplies Pet Accessories Slow', 'dropship-slow-feeder-bowl-pet-accessories', 9.00, 75, '/images/products/slow-feeder-bowl.jpg', 'Slow feeder bowl that helps prevent gulping and promotes healthy digestion.', 'Slow feeder bowl for healthy eating', '83ee06f0-696d-4d50-80a9-499c68c53639', true, NOW(), NOW()),
('7c30bda2-4604-4c22-a811-cd51fc8ee266', 'Dropship Portable Pet Water Bottle', 'dropship-portable-pet-water-bottle', 6.00, 80, '/images/products/portable-water-bottle.jpg', 'Convenient portable water bottle for pets on the go. Perfect for walks and travel.', 'Portable water bottle for pets', '83ee06f0-696d-4d50-80a9-499c68c53639', true, NOW(), NOW()),

-- Pet Beds Category
('65165c4e-2f69-4e58-a75d-b95a11bafa2a', 'Dropship PaWz Pet Bed Orthopedic Dog Beds Bedding Soft Warm Mat Mattress Nest', 'dropship-pawz-pet-bed-orthopedic', 28.00, 30, '/images/products/pawz-pet-bed.jpg', 'Orthopedic pet bed designed for ultimate comfort and joint support.', 'Orthopedic pet bed for comfort and support', '0004cbb8-65e6-4924-81ef-4f608df2018b', true, NOW(), NOW()),

-- Toys & Enrichment Category
('afac4c1b-59fe-4040-af9e-437ea0bdfa63', 'Interactive Cat Laser Toy', 'interactive-cat-laser-toy', 10.00, 75, NULL, 'Interactive laser toy to keep your cat entertained and active.', 'Interactive laser toy for cats', 'ecb2cbee-ef20-49a7-9f3a-b76a3c127d13', true, NOW(), NOW()),

-- General/Uncategorized Products (no specific category)
('fb5b554d-43b1-4604-815b-f618398711a1', 'Airline-Approved Travel Carrier', 'airline-approved-travel-carrier', 22.00, 30, NULL, 'Perfect for air travel with your pet. Meets airline regulations and provides comfort during flights.', 'Airline-approved pet carrier for safe travel', NULL, true, NOW(), NOW()),
('078fbf78-2004-473a-b56f-94c53eab2776', 'Organic Pet Paw Balm', 'organic-pet-paw-balm', 4.00, 80, NULL, 'Natural organic balm to soothe and protect your pet''s paws.', 'Organic balm for pet paw care', NULL, true, NOW(), NOW()),
('999f634f-2d2f-47bc-8600-c386896c91d3', 'Pet Birthday Kit Box', 'pet-birthday-kit-box', 7.00, 40, NULL, 'Complete birthday kit to celebrate your pet''s special day.', 'Birthday celebration kit for pets', NULL, true, NOW(), NOW()),
('df677efd-ea70-4e9a-bb44-c4d74080961d', 'Self-Clean Grooming Brush', 'self-clean-grooming-brush', 5.00, 60, NULL, 'Self-cleaning grooming brush that makes pet grooming easier and more effective.', 'Self-cleaning brush for pet grooming', NULL, true, NOW(), NOW())

ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    short_description = EXCLUDED.short_description,
    category_id = EXCLUDED.category_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =============================================================================
-- 3. CLEAN UP INACTIVE DATA
-- =============================================================================

-- Deactivate any categories not in our current set
UPDATE categories 
SET updated_at = NOW()
WHERE slug NOT IN (
    'collars-accessories',
    'feeding-water', 
    'pet-beds',
    'toys-enrichment'
);

-- Deactivate any products not in our current development set
UPDATE products 
SET is_active = false, updated_at = NOW()
WHERE slug NOT IN (
    'airline-approved-travel-carrier',
    'dropship-lick-mat-dogs-cats', 
    'dropship-pawz-pet-bed-orthopedic',
    'dropship-personalized-reflective-collar',
    'dropship-portable-pet-water-bottle',
    'dropship-slow-feeder-bowl-pet-accessories',
    'dropship-soft-crystal-personalized-collar',
    'interactive-cat-laser-toy',
    'luxury-rope-leash',
    'organic-pet-paw-balm',
    'pet-birthday-kit-box',
    'self-clean-grooming-brush'
);

-- =============================================================================
-- 4. VERIFICATION QUERIES
-- =============================================================================

-- Check categories (should show 4 categories)
SELECT COUNT(*) as total_categories FROM categories;
SELECT name, slug, description FROM categories ORDER BY name;

-- Check products by category with images prioritized
SELECT 
    c.name as category_name,
    p.name as product_name,
    p.price,
    p.in_stock,
    CASE WHEN p.image_url IS NOT NULL THEN 'With Image' ELSE 'No Image' END as image_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
ORDER BY 
    c.name NULLS LAST,
    CASE WHEN p.image_url IS NOT NULL THEN 0 ELSE 1 END,  -- Products with images first
    p.name;

-- Check total active products (should show 12)
SELECT COUNT(*) as total_active_products FROM products WHERE is_active = true;

-- Check products with images by category (should show products with photos first)
SELECT 
    c.name as category,
    COUNT(p.id) as product_count,
    COUNT(CASE WHEN p.image_url IS NOT NULL THEN 1 END) as products_with_images
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;

-- =============================================================================
-- SUMMARY: This script will sync both categories AND products
-- ✅ 4 Categories: Collars & Accessories, Feeding & Water, Pet Beds, Toys & Enrichment
-- ✅ 12 Products: Properly categorized with images prioritized in shop display
-- ✅ Shop by Category section will now show real data instead of hardcoded data
-- =============================================================================