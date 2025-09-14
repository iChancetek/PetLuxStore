-- Production Database Update Script for PotLuxE
-- Run this script against your production database to sync changes from development
-- Created: 2025-01-14

-- =============================================================================
-- 1. Update existing products with new prices and inventory levels
-- =============================================================================

-- Update Airline-Approved Travel Carrier
UPDATE products 
SET price = 22.00, in_stock = 30, updated_at = NOW()
WHERE name = 'Airline-Approved Travel Carrier';

-- Update Mat For Dogs Cats Slow Food Bowls
UPDATE products 
SET price = 16.99, in_stock = 90, image_url = '/images/products/lick-mat.jpg', updated_at = NOW()
WHERE name LIKE '%Mat For Dogs Cats Slow Food Bowls%' OR name LIKE '%Dropship Mat For Dogs Cats%';

-- Update PaWz Pet Bed Orthopedic Dog Beds
UPDATE products 
SET price = 28.00, in_stock = 30, image_url = '/images/products/pawz-pet-bed.jpg', updated_at = NOW()
WHERE name LIKE '%PaWz Pet Bed%' OR name LIKE '%Orthopedic Dog Beds%';

-- Update Personalized Reflective Dog Collar
UPDATE products 
SET price = 29.99, in_stock = 60, image_url = '/images/products/reflective-collar.jpg', updated_at = NOW()
WHERE name LIKE '%Reflective Dog Collar%' OR name LIKE '%Personalized Reflective%';

-- Update Portable Pet Water Bottle
UPDATE products 
SET price = 6.00, in_stock = 80, image_url = '/images/products/portable-water-bottle.jpg', updated_at = NOW()
WHERE name LIKE '%Portable Pet Water Bottle%';

-- Update Slow Feeder Bowl
UPDATE products 
SET price = 9.00, in_stock = 75, image_url = '/images/products/slow-feeder-bowl.jpg', updated_at = NOW()
WHERE name LIKE '%Slow Feeder Bowl%';

-- Update Soft Crystal Personalized Dog Collar
UPDATE products 
SET price = 8.00, in_stock = 40, image_url = '/images/products/crystal-collar.jpg', updated_at = NOW()
WHERE name LIKE '%Crystal%' AND name LIKE '%Collar%';

-- Update Interactive Cat Laser Toy
UPDATE products 
SET price = 10.00, in_stock = 75, updated_at = NOW()
WHERE name = 'Interactive Cat Laser Toy';

-- Update Luxury Rope Leash
UPDATE products 
SET price = 10.00, in_stock = 50, updated_at = NOW()
WHERE name = 'Luxury Rope Leash';

-- Update Organic Pet Paw Balm
UPDATE products 
SET price = 4.00, in_stock = 80, updated_at = NOW()
WHERE name = 'Organic Pet Paw Balm';

-- Update Pet Birthday Kit Box
UPDATE products 
SET price = 7.00, in_stock = 40, updated_at = NOW()
WHERE name = 'Pet Birthday Kit Box';

-- Update Self-Clean Grooming Brush
UPDATE products 
SET price = 5.00, in_stock = 60, updated_at = NOW()
WHERE name = 'Self-Clean Grooming Brush';

-- =============================================================================
-- 2. Insert new products if they don't exist (using INSERT ... ON CONFLICT)
-- =============================================================================

-- Note: These INSERT statements will only add products if they don't already exist
-- based on the product name. If they exist, they'll be updated with new values.

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    'fb5b554d-43b1-4604-815b-f618398711a1',
    'Airline-Approved Travel Carrier',
    'airline-approved-travel-carrier',
    22.00,
    30,
    NULL,
    'Perfect for air travel with your pet. Meets airline regulations and provides comfort during flights.',
    'Airline-approved pet carrier for safe travel',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    'd134d1c4-72ad-45e1-bafd-31e085082a9d',
    'Dropship Mat For Dogs Cats Slow Food Bowls New Pet Dog Feeding Food Bowl',
    'dropship-mat-dogs-cats-slow-food-bowls',
    16.99,
    90,
    '/images/products/lick-mat.jpg',
    'Slow feeding mat that promotes healthy eating habits and reduces bloating in pets.',
    'Slow feeding mat for healthier eating',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    '65165c4e-2f69-4e58-a75d-b95a11bafa2a',
    'Dropship PaWz Pet Bed Orthopedic Dog Beds Bedding Soft Warm Mat Mattress Nest',
    'dropship-pawz-pet-bed-orthopedic',
    28.00,
    30,
    '/images/products/pawz-pet-bed.jpg',
    'Orthopedic pet bed designed for ultimate comfort and joint support.',
    'Orthopedic pet bed for comfort and support',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    'debb28ae-8079-4bc8-9176-c6414ab9404f',
    'Dropship Personalized Reflective Dog Collar Custom Pet',
    'dropship-personalized-reflective-dog-collar',
    29.99,
    60,
    '/images/products/reflective-collar.jpg',
    'Custom reflective dog collar for safety and style. Personalize with your pet''s name.',
    'Personalized reflective collar for safety',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    '7c30bda2-4604-4c22-a811-cd51fc8ee266',
    'Dropship Portable Pet Water Bottle',
    'dropship-portable-pet-water-bottle',
    6.00,
    80,
    '/images/products/portable-water-bottle.jpg',
    'Convenient portable water bottle for pets on the go. Perfect for walks and travel.',
    'Portable water bottle for pets',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    '08e8854c-3600-46b9-bcbf-02d5dfe93b23',
    'Dropship Slow Feeder Bowl Slow Feeder Bath Pet Supplies Pet Accessories Slow',
    'dropship-slow-feeder-bowl',
    9.00,
    75,
    '/images/products/slow-feeder-bowl.jpg',
    'Slow feeder bowl that helps prevent gulping and promotes healthy digestion.',
    'Slow feeder bowl for healthy eating',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    'c0bb0545-1aba-4ce1-a06f-ad16bdb675ef',
    'Dropship Soft Crystal Personalized Dog Collar Customized',
    'dropship-soft-crystal-dog-collar',
    8.00,
    40,
    '/images/products/crystal-collar.jpg',
    'Elegant crystal dog collar that can be personalized with your pet''s information.',
    'Crystal collar with personalization',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    'afac4c1b-59fe-4040-af9e-437ea0bdfa63',
    'Interactive Cat Laser Toy',
    'interactive-cat-laser-toy',
    10.00,
    75,
    NULL,
    'Interactive laser toy to keep your cat entertained and active.',
    'Interactive laser toy for cats',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    '09482d49-ab45-4b93-8167-185d618343d2',
    'Luxury Rope Leash',
    'luxury-rope-leash',
    10.00,
    50,
    NULL,
    'Premium rope leash for style and durability during walks.',
    'Premium rope leash for dogs',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    '078fbf78-2004-473a-b56f-94c53eab2776',
    'Organic Pet Paw Balm',
    'organic-pet-paw-balm',
    4.00,
    80,
    NULL,
    'Natural organic balm to soothe and protect your pet''s paws.',
    'Organic balm for pet paw care',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    '999f634f-2d2f-47bc-8600-c386896c91d3',
    'Pet Birthday Kit Box',
    'pet-birthday-kit-box',
    7.00,
    40,
    NULL,
    'Complete birthday kit to celebrate your pet''s special day.',
    'Birthday celebration kit for pets',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    updated_at = NOW();

INSERT INTO products (id, name, slug, price, in_stock, image_url, description, short_description, is_active, created_at, updated_at)
VALUES 
(
    'df677efd-ea70-4e9a-bb44-c4d74080961d',
    'Self-Clean Grooming Brush',
    'self-clean-grooming-brush',
    5.00,
    60,
    NULL,
    'Self-cleaning grooming brush that makes pet grooming easier and more effective.',
    'Self-cleaning brush for pet grooming',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE SET 
    price = EXCLUDED.price,
    in_stock = EXCLUDED.in_stock,
    updated_at = NOW();

-- =============================================================================
-- 3. Verification queries (run these to check the updates worked)
-- =============================================================================

-- Check all products after update
-- SELECT name, price, in_stock, image_url FROM products ORDER BY name;

-- Check products with images (should appear first in shop)
-- SELECT name, price, in_stock, image_url FROM products WHERE image_url IS NOT NULL ORDER BY name;

-- Check total product count
-- SELECT COUNT(*) as total_products FROM products WHERE is_active = true;

-- =============================================================================
-- 4. Optional cleanup (uncomment if needed)
-- =============================================================================

-- Remove any products that should no longer be active
-- UPDATE products SET is_active = false WHERE name = 'Product Name To Deactivate';

-- =============================================================================
-- Notes:
-- - This script uses ON CONFLICT to safely update existing products
-- - Products with images will be prioritized in the shop display
-- - All prices and inventory levels match development database
-- - Run verification queries to confirm changes applied correctly
-- =============================================================================