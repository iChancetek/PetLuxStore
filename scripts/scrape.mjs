import fetch from 'node-fetch'; // NextJS/Node 18 has fetch globally, but just in case we'll rely on global fetch since Node 24 is used.

const urls = [
  "https://www.spocket.co/dropship/pets/personalized-dog-colar-reflective-embroidered",
  "https://www.spocket.co/dropship/pets/personalized-reflective-dog-colar-custom-pet",
  "https://www.spocket.co/dropship/pets/personalized-pet-dog-colar-reflective-custom",
  "https://www.spocket.co/dropship/tech-accessories/pawz-pet-bed-orthopedic-dog-beds-beding-soft-warm-mat-matres",
  "https://www.spocket.co/dropship/tech-accessories/memory-foam-dog-bed-15cm-thick-large-orthopedic-dog-pet-beds-95782527",
  "https://www.spocket.co/dropship/pets-beds-blankets/midwe-27063-ortho-nest-bed-gray",
  "https://www.spocket.co/dropship/pets/personalized-dog-colar-durable-nylon-reflective",
  "https://www.spocket.co/dropship/pets/dog-colars-and-leash-set-reflective-pet-dog-tag-colar-leash-"
];

async function run() {
  for (const url of urls) {
    try {
      const r = await fetch(url + "?srsltid=test&utm_source=test", {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const text = await r.text();
      const ogMatch = text.match(/<meta property="og:image" content="([^"]+)"/i);
      const mainMatch = text.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
      
      console.log(`\nURL: ${url}`);
      console.log(`OG Image: ${ogMatch ? ogMatch[1] : 'Not Found'}`);
      console.log(`First IMG: ${mainMatch ? mainMatch[1] : 'Not Found'}`);
    } catch (err) {
      console.error(err);
    }
  }
}
run();
