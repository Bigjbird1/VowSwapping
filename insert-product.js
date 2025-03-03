const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('prisma/dev.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to the database.');
});

// Insert a product
const insertProduct = () => {
  // Get a user ID first
  db.get('SELECT id FROM User LIMIT 1', (err, row) => {
    if (err) {
      console.error('Error getting user:', err.message);
      return;
    }
    
    if (!row) {
      console.error('No users found in the database');
      return;
    }
    
    const userId = row.id;
    console.log(`Found user with ID: ${userId}`);
    
    // Prepare product data
    const product = {
      id: 'product-' + Date.now(),
      title: 'Test Wedding Dress',
      description: 'A beautiful test wedding dress',
      price: 1000,
      discountPrice: 800,
      images: JSON.stringify(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']),
      category: 'DRESSES',
      condition: 'LIKE_NEW',
      tags: JSON.stringify(['test', 'wedding', 'dress']),
      featured: 1,
      approved: 1,
      sellerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Insert the product
    const sql = `
      INSERT INTO Product (
        id, title, description, price, discountPrice, 
        images, category, condition, tags, featured, 
        sellerId, createdAt, updatedAt, approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      product.id,
      product.title,
      product.description,
      product.price,
      product.discountPrice,
      product.images,
      product.category,
      product.condition,
      product.tags,
      product.featured,
      product.sellerId,
      product.createdAt,
      product.updatedAt,
      product.approved
    ];
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error inserting product:', err.message);
        return;
      }
      
      console.log(`Product inserted with ID: ${product.id}`);
      
      // Verify the product was inserted
      db.get('SELECT * FROM Product WHERE id = ?', [product.id], (err, row) => {
        if (err) {
          console.error('Error verifying product:', err.message);
          return;
        }
        
        console.log('Inserted product:', row);
        
        // Close the database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            return;
          }
          console.log('Database connection closed.');
        });
      });
    });
  });
};

// Run the insert function
insertProduct();
