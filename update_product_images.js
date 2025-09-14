import { storage } from './server/storage.js';

// Smart mapping of products to their extracted images
const productImageMapping = [
  {
    slug: "pawz-pet-bed", 
    imageUrl: "/images/products/pet-bed-main.jpg",
    description: "Orthopedic dog mattress with memory foam"
  },
  {
    slug: "memory-foam-dog-bed-15cm",
    imageUrl: "/images/products/product-1.jpg", 
    description: "15cm thick memory foam bed navy/grey"
  },
  {
    slug: "personalized-dog-collar",
    imageUrl: "/images/products/product-2.jpg",
    description: "Reflective embroidered collar"
  },
  {
    slug: "personalized-reflective-dog-collar-custom",
    imageUrl: "/images/products/product-3.jpg",
    description: "Custom reflective collar olive demeter"
  },
  {
    slug: "portable-pet-water-bottle", 
    imageUrl: "/images/products/product-4.jpg",
    description: "Compact travel water bottle"
  },
  {
    slug: "2-in-1-portable-pet-water-bottle",
    imageUrl: "/images/products/product-5.jpg", 
    description: "Foldable water bottle with food container"
  },
  {
    slug: "slow-feeder-bowl",
    imageUrl: "/images/products/product-6.jpg",
    description: "Designer marble style slow feeder bowl" 
  },
  {
    slug: "slow-food-lick-mat-bowl", 
    imageUrl: "/images/products/product-7.jpg",
    description: "Silicone lick mat with suction cups"
  },
  {
    slug: "birthday-luxe-box",
    imageUrl: "/images/products/product-8.jpg",
    description: "Celebration bundle with toys and treats"
  }
];

async function updateProductImages() {
  try {
    console.log('🔄 Updating product images in database...');
    
    // Get all products first
    const products = await storage.getProducts();
    console.log(`📦 Found ${products.length} products in database`);
    
    for (const mapping of productImageMapping) {
      const product = products.find(p => p.slug === mapping.slug);
      
      if (product) {
        console.log(`📸 Updating ${product.name} → ${mapping.imageUrl}`);
        
        // Update product with new image URL
        await storage.updateProduct(product.id, {
          imageUrl: mapping.imageUrl
        });
        
        console.log(`✅ Updated ${product.name}`);
      } else {
        console.log(`❌ Product not found: ${mapping.slug}`);
      }
    }
    
    console.log('\n🎉 Product image mapping completed!');
    console.log('\n📋 Image Mapping Summary:');
    productImageMapping.forEach((mapping, index) => {
      console.log(`${index + 1}. ${mapping.slug} → ${mapping.imageUrl}`);
    });
    
    console.log('\n✨ Your shop now has beautiful product images!');
    
  } catch (error) {
    console.error('❌ Error updating product images:', error.message);
  }
}

updateProductImages();