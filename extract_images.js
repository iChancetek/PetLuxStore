import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

async function extractImages() {
  try {
    const zipPath = 'attached_assets/(No subject) (2)_1757820573984.zip';
    const targetDir = 'client/public/images/products/';
    
    // Copy existing JPEG file first
    const existingImage = 'attached_assets/0B0E16AF-E3B0-48C6-8811-611475D2BA8A_1757801401107.jpeg';
    if (fs.existsSync(existingImage)) {
      fs.copyFileSync(existingImage, path.join(targetDir, 'pet-bed-main.jpg'));
      console.log('✅ Copied existing image as pet-bed-main.jpg');
    }
    
    // Extract images from zip file
    if (fs.existsSync(zipPath)) {
      console.log('📦 Extracting product images from zip file...');
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      
      let imageCount = 0;
      entries.forEach((entry, index) => {
        if (!entry.isDirectory) {
          const fileName = entry.entryName.toLowerCase();
          
          // Check if it's an image file
          if (fileName.includes('.jpg') || fileName.includes('.jpeg') || fileName.includes('.png') || fileName.includes('.webp')) {
            const extension = path.extname(fileName);
            const cleanName = `product-${imageCount + 1}${extension}`;
            
            // Extract the image
            const content = entry.getData();
            fs.writeFileSync(path.join(targetDir, cleanName), content);
            
            console.log(`✅ Extracted: ${cleanName} (${(content.length / 1024).toFixed(1)}KB)`);
            imageCount++;
          }
        }
      });
      
      console.log(`🎉 Successfully extracted ${imageCount} product images!`);
      
      // List all extracted files
      const extractedFiles = fs.readdirSync(targetDir);
      console.log('\n📷 Available product images:');
      extractedFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
      
    } else {
      console.log('❌ Zip file not found');
    }
    
  } catch (error) {
    console.error('❌ Error extracting images:', error.message);
  }
}

extractImages();