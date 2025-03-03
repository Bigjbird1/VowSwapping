const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('prisma/dev.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to the database.');
});

// Fix product images format
const fixImagesFormat = () => {
  // Get all products
  db.all('SELECT id FROM Product', (err, rows) => {
    if (err) {
      console.error('Error getting products:', err.message);
      return;
    }
    
    console.log(`Found ${rows.length} products`);
    
    // Process each product
    let completed = 0;
    
    if (rows.length === 0) {
      console.log('No products to fix');
      db.close();
      return;
    }
    
    rows.forEach(product => {
      try {
        console.log(`Processing product ${product.id}`);
        
        // Create a properly formatted array with commas
        const properImages = [
          "https://images.unsplash.com/photo-1594552072238-5c4a26f10bfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
          "https://images.unsplash.com/photo-1546167889-0b4b5ff0aec3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
        ];
        
        // Convert to a properly formatted JSON string
        const fixedImages = JSON.stringify(properImages);
        console.log(`Fixed images: ${fixedImages}`);
        
        // Update the product
        db.run('UPDATE Product SET images = ? WHERE id = ?', [fixedImages, product.id], function(err) {
          if (err) {
            console.error(`Error updating product ${product.id}:`, err.message);
          } else {
            console.log(`Updated product ${product.id} with fixed images format`);
          }
          
          completed++;
          
          // Close the database when all products are processed
          if (completed === rows.length) {
            console.log('All products processed');
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err.message);
                return;
              }
              console.log('Database connection closed.');
            });
          }
        });
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        completed++;
        
        if (completed === rows.length) {
          console.log('All products processed');
          db.close();
        }
      }
    });
  });
};

// Run the fix function
fixImagesFormat();
