const { Pool } = require('pg');
require('dotenv').config();
const { safeParseJson, safeStringifyJson } = require('./src/lib/json-conversion');

// Parse the DATABASE_URL
const connectionString = process.env.DATABASE_URL;
console.log('Database URL:', connectionString ? 'Found' : 'Not found');

try {
  console.log('Creating database pool...');
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  async function fixProductImages() {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to database successfully!');
  
    try {
      console.log('Fetching products with potentially malformed images...');
      
      // Get all products
      const productsResult = await client.query(`
        SELECT id, images FROM "Product"
      `);
      
      console.log(`Found ${productsResult.rows.length} products to check`);
      
      let updatedCount = 0;
      
      // Process each product
      for (const product of productsResult.rows) {
        try {
          console.log(`Processing product ${product.id}`);
          
          let images = product.images;
          let needsUpdate = false;
          
          // Use safeParseJson to handle string to object conversion
          if (typeof images === 'string') {
            console.log(`Product ${product.id} has string images: ${images}`);
            
            // Try to parse it as JSON using our utility
            const parsedImages = safeParseJson(images);
            
            if (parsedImages !== null) {
              images = parsedImages;
              needsUpdate = true;
            } else {
              console.error(`Error parsing images JSON for product ${product.id}`);
              
              // If it's a string that looks like an array but isn't valid JSON,
              // try to fix common issues and convert it to a proper array
              if (images.startsWith('[') && images.endsWith(']')) {
                try {
                  // Clean up the string and try to parse again
                  const cleanedString = images
                    .replace(/\\"/g, '"')  // Replace escaped quotes
                    .replace(/"\[/g, '[')  // Remove quotes around array start
                    .replace(/\]"/g, ']'); // Remove quotes around array end
                  
                  const parsedCleanedImages = safeParseJson(cleanedString);
                  if (parsedCleanedImages !== null) {
                    images = parsedCleanedImages;
                    needsUpdate = true;
                  } else {
                    console.error(`Failed to clean and parse images for product ${product.id}`);
                  }
                } catch (cleanupError) {
                  console.error(`Failed to clean and parse images for product ${product.id}:`, cleanupError);
                }
              }
            }
          }
          
          // If images is not an array but should be, convert it
          if (images && !Array.isArray(images) && typeof images === 'object') {
            console.log(`Product ${product.id} has non-array object images:`, images);
            // If it's an object with numeric keys, convert to array
            if (Object.keys(images).every(key => !isNaN(parseInt(key)))) {
              const arrayImages = Object.values(images);
              images = arrayImages;
              needsUpdate = true;
            }
          }
          
          // Special case: if images is a string that looks like ["url"]
          if (typeof images === 'string' && images.match(/^\[.*\]$/)) {
            try {
              // Try to extract URLs from the string
              const urlMatches = images.match(/"(https?:\/\/[^"]+)"/g);
              if (urlMatches) {
                images = urlMatches.map(match => match.replace(/^"|"$/g, ''));
                needsUpdate = true;
              }
            } catch (extractError) {
              console.error(`Error extracting URLs from images string for product ${product.id}:`, extractError);
            }
          }
          
          // If we need to update the product
          if (needsUpdate) {
            console.log(`Updating product ${product.id} with fixed images format`);
            
            // Ensure images is an array
            if (!Array.isArray(images)) {
              images = [images].filter(Boolean);
            }
            
            // Update the product with the fixed images using safeStringifyJson
            await client.query(`
              UPDATE "Product" 
              SET images = $1::jsonb
              WHERE id = $2
            `, [safeStringifyJson(images), product.id]);
            
            updatedCount++;
            console.log(`Updated product ${product.id}`);
          } else {
            console.log(`Product ${product.id} has correctly formatted images, no update needed`);
          }
        } catch (productError) {
          console.error(`Error processing product ${product.id}:`, productError);
        }
      }
      
      console.log(`Completed processing. Updated ${updatedCount} products.`);
      
    } catch (error) {
      console.error('Error fixing product images:', error);
    } finally {
      client.release();
      await pool.end();
    }
  }

  fixProductImages()
    .then(() => {
      console.log('Image format fix completed.');
    })
    .catch(e => {
      console.error('Unexpected error:', e);
      process.exit(1);
    });
} catch (error) {
  console.error('Error setting up database connection:', error);
}
