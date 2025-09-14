-- CORRECTED Production Database Update Script for PotLuxE
-- This fixes the issues with the previous script
-- Run this script against your production database to sync changes from development
-- Created: 2025-01-14 (Fixed Version)

-- =============================================================================
-- 1. First, remove any duplicate products (keeping the first one by creation date)
-- =============================================================================

-- Remove duplicate products based on slug (which is the unique constraint)
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

-- =============================================================================
-- 2. Upsert all products using the correct unique constraint (slug)
-- =============================================================================

-- Insert or update all products from development data
INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
-- Product 1: Airline-Approved Travel Carrier
('fb5b554d-43b1-4604-815b-f618398711a1', 'Airline-Approved Travel Carrier', 'airline-approved-travel-carrier', 22.00, 30, NULL, 'Perfect for air travel with your pet. Meets airline regulations and provides comfort during flights.', 'Airline-approved pet carrier for safe travel', true, NOW(), NOW()),

-- Product 2: Lick Mat (with image - should appear first in shop)
('d134d1c4-72ad-45e1-bafd-31e085082a9d', 'Dropship Mat For Dogs Cats Slow Food Bowls New Pet Dog Feeding Food Bowl', 'dropship-lick-mat-dogs-cats', 16.99, 90, '/images/products/lick-mat.jpg', 'Slow feeding mat that promotes healthy eating habits and reduces bloating in pets.', 'Slow feeding mat for healthier eating', true, NOW(), NOW()),

-- Product 3: PaWz Pet Bed (with image - should appear first in shop)
('65165c4e-2f69-4e58-a75d-b95a11bafa2a', 'Dropship PaWz Pet Bed Orthopedic Dog Beds Bedding Soft Warm Mat Mattress Nest', 'dropship-pawz-pet-bed-orthopedic', 28.00, 30, '/images/products/pawz-pet-bed.jpg', 'Orthopedic pet bed designed for ultimate comfort and joint support.', 'Orthopedic pet bed for comfort and support', true, NOW(), NOW()),

-- Product 4: Reflective Dog Collar (with image - should appear first in shop)
('debb28ae-8079-4bc8-9176-c6414ab9404f', 'Dropship Personalized Reflective Dog Collar Custom Pet', 'dropship-personalized-reflective-collar', 29.99, 60, '/images/products/reflective-collar.jpg', 'Custom reflective dog collar for safety and style. Personalize with your pet''s name.', 'Personalized reflective collar for safety', true, NOW(), NOW()),

-- Product 5: Portable Pet Water Bottle (with image - should appear first in shop)
('7c30bda2-4604-4c22-a811-cd51fc8ee266', 'Dropship Portable Pet Water Bottle', 'dropship-portable-pet-water-bottle', 6.00, 80, '/images/products/portable-water-bottle.jpg', 'Convenient portable water bottle for pets on the go. Perfect for walks and travel.', 'Portable water bottle for pets', true, NOW(), NOW()),

-- Product 6: Slow Feeder Bowl (with image - should appear first in shop)
('08e8854c-3600-46b9-bcbf-02d5dfe93b23', 'Dropship Slow Feeder Bowl Slow Feeder Bath Pet Supplies Pet Accessories Slow', 'dropship-slow-feeder-bowl-pet-accessories', 9.00, 75, '/images/products/slow-feeder-bowl.jpg', 'Slow feeder bowl that helps prevent gulping and promotes healthy digestion.', 'Slow feeder bowl for healthy eating', true, NOW(), NOW()),

-- Product 7: Crystal Dog Collar (with image - should appear first in shop)
('c0bb0545-1aba-4ce1-a06f-ad16bdb675ef', 'Dropship Soft Crystal Personalized Dog Collar Customized', 'dropship-soft-crystal-personalized-collar', 8.00, 40, '/images/products/crystal-collar.jpg', 'Elegant crystal dog collar that can be personalized with your pet''s information.', 'Crystal collar with personalization', true, NOW(), NOW()),

-- Product 8: Interactive Cat Laser Toy (no image - will appear after products with images)
('afac4c1b-59fe-4040-af9e-437ea0bdfa63', 'Interactive Cat Laser Toy', 'interactive-cat-laser-toy', 10.00, 75, NULL, 'Interactive laser toy to keep your cat entertained and active.', 'Interactive laser toy for cats', true, NOW(), NOW()),

-- Product 9: Luxury Rope Leash (no image - will appear after products with images)
('09482d49-ab45-4b93-8167-185d618343d2', 'Luxury Rope Leash', 'luxury-rope-leash', 10.00, 50, NULL, 'Premium rope leash for style and durability during walks.', 'Premium rope leash for dogs', true, NOW(), NOW()),

-- Product 10: Organic Pet Paw Balm (no image - will appear after products with images)
('078fbf78-2004-473a-b56f-94c53eab2776', 'Organic Pet Paw Balm', 'organic-pet-paw-balm', 4.00, 80, NULL, 'Natural organic balm to soothe and protect your pet''s paws.', 'Organic balm for pet paw care', true, NOW(), NOW()),

-- Product 11: Pet Birthday Kit Box (no image - will appear after products with images)
('999f634f-2d2f-47bc-8600-c386896c91d3', 'Pet Birthday Kit Box', 'pet-birthday-kit-box', 7.00, 40, NULL, 'Complete birthday kit to celebrate your pet''s special day.', 'Birthday celebration kit for pets', true, NOW(), NOW()),

-- Product 12: Self-Clean Grooming Brush (no image - will appear after products with images)
('df677efd-ea70-4e9a-bb44-c4d74080961d', 'Self-Clean Grooming Brush', 'self-clean-grooming-brush', 5.00, 60, NULL, 'Self-cleaning grooming brush that makes pet grooming easier and more effective.', 'Self-cleaning brush for pet grooming', true, NOW(), NOW())

-- FIXED: Using ON CONFLICT (slug) which is the actual unique constraint
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    short_description = EXCLUDED.short_description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- =============================================================================
-- 3. Clean up any inactive or unwanted products
-- =============================================================================

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
-- 4. Verification queries (run these to check the updates worked)
-- =============================================================================

-- Check all active products after update (should show 12 products)
SELECT COUNT(*) as total_active_products FROM products WHERE is_active = true;

-- Check products with images (these should appear first in shop - should show 7 products)
SELECT name, price, in_stock, image_url 
FROM products 
WHERE image_url IS NOT NULL AND is_active = true 
ORDER BY name;

-- Check products without images (these should appear after products with images - should show 5 products)
SELECT name, price, in_stock 
FROM products 
WHERE image_url IS NULL AND is_active = true 
ORDER BY name;

-- Check for any duplicates (should return 0 rows)
SELECT slug, COUNT(*) as duplicate_count 
FROM products 
WHERE is_active = true 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Show final product list in shop order (products with images first, then without)
SELECT 
    name, 
    price, 
    in_stock, 
    CASE WHEN image_url IS NOT NULL THEN 'With Image' ELSE 'No Image' END as image_status,
    image_url
FROM products 
WHERE is_active = true 
ORDER BY 
    CASE WHEN image_url IS NOT NULL THEN 0 ELSE 1 END,  -- Products with images first
    name;

-- =============================================================================
-- SUMMARY OF FIXES:
-- =============================================================================
-- ✅ FIXED: Uses ON CONFLICT (slug) instead of (name) - matches unique constraint
-- ✅ FIXED: Removes duplicates before upsert to prevent conflicts
-- ✅ FIXED: Uses exact development data including correct slugs
-- ✅ FIXED: Products with images will appear first in shop (7 products)
-- ✅ FIXED: Products without images will appear after (5 products)
-- ✅ FIXED: Deactivates any products not in current development set
-- ✅ FIXED: Includes verification queries to confirm changes
-- =============================================================================