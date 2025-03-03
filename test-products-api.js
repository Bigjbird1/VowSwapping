// Simple script to test the products API
import fetch from 'node-fetch';

// Add this line to make it an ES module
export {};

async function testProductsAPI() {
  try {
    console.log('Testing products API...');
    
    // Test getting all products
    const allProductsResponse = await fetch('http://localhost:3002/api/products');
    const allProducts = await allProductsResponse.json();
    console.log(`All products: ${allProducts.products.length} found`);
    
    // Test filtering by category
    const categoryResponse = await fetch('http://localhost:3002/api/products?category=dresses');
    const categoryProducts = await categoryResponse.json();
    console.log(`Category 'dresses' products: ${categoryProducts.products.length} found`);
    
    // Test filtering by price range
    const priceResponse = await fetch('http://localhost:3002/api/products?minPrice=100&maxPrice=500');
    const priceProducts = await priceResponse.json();
    console.log(`Price range $100-$500 products: ${priceProducts.products.length} found`);
    
    // Test filtering by condition
    const conditionResponse = await fetch('http://localhost:3002/api/products?condition=new');
    const conditionProducts = await conditionResponse.json();
    console.log(`Condition 'new' products: ${conditionProducts.products.length} found`);
    
    // Test search
    const searchResponse = await fetch('http://localhost:3002/api/products?q=wedding');
    const searchProducts = await searchResponse.json();
    console.log(`Search 'wedding' products: ${searchProducts.products.length} found`);
    
    // Test getting a single product
    if (allProducts.products.length > 0) {
      const productId = allProducts.products[0].id;
      const productResponse = await fetch(`http://localhost:3002/api/products/${productId}`);
      const product = await productResponse.json();
      console.log(`Product details for ${productId}: ${product.title}`);
    }
  } catch (error) {
    console.error('Error testing products API:', error);
  }
}

testProductsAPI();
