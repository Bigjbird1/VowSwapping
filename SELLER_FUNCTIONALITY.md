# Seller & Marketplace Functionality

This document outlines the implementation of Phase 3 of the VowSwap project, which transforms the platform from a single-seller system to a multi-seller marketplace.

## Overview

The seller functionality allows users to:
1. Register as sellers
2. Create and manage their own shop
3. List and manage their products
4. View sales and analytics
5. Receive reviews and ratings

## Database Schema Changes

The following changes were made to the database schema:

### User Model Extensions
- `isSeller`: Boolean flag indicating if a user is a seller
- `sellerApproved`: Boolean flag indicating if a seller has been approved by admin
- `shopName`: Name of the seller's shop
- `shopDescription`: Description of the seller's shop
- `sellerRating`: Average rating of the seller (1-5 stars)
- `sellerRatingsCount`: Number of ratings received
- `sellerSince`: Date when the user became a seller
- `sellerBio`: Seller's biography
- `sellerLogo`: URL to the seller's logo image
- `sellerBanner`: URL to the seller's banner image
- `sellerSocial`: JSON object containing social media links

### Product Model Extensions
- `approved`: Boolean flag indicating if a product has been approved by admin

### New Review Model
- `rating`: Integer rating (1-5)
- `comment`: Optional text review
- `productId`: Optional reference to a product (for product reviews)
- `sellerId`: Optional reference to a seller (for seller reviews)
- `reviewerId`: ID of the user who left the review
- `reviewerName`: Name of the reviewer

## Key Features

### Seller Registration
- Users can apply to become sellers through the "Become a Seller" page
- Sellers provide shop information, biography, and optional logo/banner images
- Admin approval is required before a seller can list products

### Seller Dashboard
- Sellers have access to a dedicated dashboard
- Dashboard displays sales statistics, recent orders, and product performance
- Sellers can manage their products, orders, and shop settings

### Shop Pages
- Each seller has a public shop page displaying their products
- Shop pages include seller information, ratings, and social media links
- Customers can browse products from specific sellers

### Product Management
- Sellers can create, edit, and delete their own products
- Products require admin approval before being visible to customers
- Sellers can track the performance of their products

### Marketplace Features
- Customers can browse shops and filter products by seller
- Product listings display seller information
- Customers can leave reviews for both products and sellers

## Implementation Details

### Frontend
- Seller registration form
- Seller dashboard with analytics
- Shop pages for each seller
- Product management interface
- Review and rating system

### Backend
- API endpoints for seller registration and management
- Product approval workflow
- Order management for sellers
- Review and rating system

## Future Enhancements
- Commission/fee structure for sellers
- Seller tiers (e.g., verified, premium)
- Messaging system between buyers and sellers
- Dispute resolution system
- Seller-specific shipping and return policies
