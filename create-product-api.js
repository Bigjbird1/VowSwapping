const axios = require('axios');

async function createProduct() {
  try {
    console.log('Creating product via API...');
    
    const response = await axios.post('http://localhost:3001/api/products', {
      title: 'Test Wedding Dress',
      description: 'A beautiful test wedding dress',
      price: 1000,
      discountPrice: 800,
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      category: 'dresses',
      condition: 'like-new',
      tags: ['test', 'wedding', 'dress'],
      featured: true,
      approved: true
    });
    
    console.log('API Response:', response.data);
    
  } catch (error) {
    console.error('Error creating product:', error.response ? error.response.data : error.message);
  }
}

createProduct();
