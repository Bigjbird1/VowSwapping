import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewList from '@/components/review/ReviewList';

// Mock the ReviewCard component
jest.mock('@/components/review/ReviewCard', () => {
  return function MockReviewCard({ review }) {
    return (
      <div data-testid="review-card">
        <div data-testid="reviewer-name">{review.reviewerName}</div>
        <div data-testid="review-rating">{review.rating}</div>
        <div data-testid="review-comment">{review.comment}</div>
        {review.product && <div data-testid="product-title">{review.product.title}</div>}
        {review.seller && <div data-testid="seller-name">{review.seller.shopName || review.seller.name}</div>}
      </div>
    );
  };
});

// Mock the StarRating component
jest.mock('@/components/review/StarRating', () => {
  return function MockStarRating({ rating }) {
    return <div data-testid="star-rating">Rating: {rating}</div>;
  };
});

describe('ReviewList Component', () => {
  const mockProductReviews = [
    {
      id: 'review-1',
      productId: 'product-1',
      reviewerId: 'user-1',
      reviewerName: 'User 1',
      rating: 5,
      comment: 'Great product!',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'review-2',
      productId: 'product-1',
      reviewerId: 'user-2',
      reviewerName: 'User 2',
      rating: 4,
      comment: 'Good product',
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z'
    },
    {
      id: 'review-3',
      productId: 'product-1',
      reviewerId: 'user-3',
      reviewerName: 'User 3',
      rating: 3,
      comment: 'Average product',
      createdAt: '2025-01-03T00:00:00.000Z',
      updatedAt: '2025-01-03T00:00:00.000Z'
    }
  ];
  
  const mockSellerReviews = [
    {
      id: 'review-4',
      sellerId: 'seller-1',
      reviewerId: 'user-1',
      reviewerName: 'User 1',
      rating: 5,
      comment: 'Great seller!',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      seller: {
        id: 'seller-1',
        name: 'Seller Name',
        shopName: 'Shop Name'
      }
    },
    {
      id: 'review-5',
      sellerId: 'seller-1',
      reviewerId: 'user-2',
      reviewerName: 'User 2',
      rating: 4,
      comment: 'Good seller',
      createdAt: '2025-01-02T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
      seller: {
        id: 'seller-1',
        name: 'Seller Name',
        shopName: 'Shop Name'
      }
    }
  ];
  
  const mockProductAndSellerReviews = [
    {
      id: 'review-1',
      productId: 'product-1',
      reviewerId: 'user-1',
      reviewerName: 'User 1',
      rating: 5,
      comment: 'Great product!',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      product: {
        id: 'product-1',
        title: 'Product Title',
        images: ['image1.jpg']
      }
    },
    {
      id: 'review-4',
      sellerId: 'seller-1',
      reviewerId: 'user-1',
      reviewerName: 'User 1',
      rating: 5,
      comment: 'Great seller!',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      seller: {
        id: 'seller-1',
        name: 'Seller Name',
        shopName: 'Shop Name'
      }
    }
  ];
  
  it('renders product reviews correctly', () => {
    render(<ReviewList reviews={mockProductReviews} />);
    
    // Check if review cards are rendered
    const reviewCards = screen.getAllByTestId('review-card');
    expect(reviewCards).toHaveLength(3);
    
    // Check if reviewer names are rendered
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.getByText('User 3')).toBeInTheDocument();
    
    // Check if review comments are rendered
    expect(screen.getByText('Great product!')).toBeInTheDocument();
    expect(screen.getByText('Good product')).toBeInTheDocument();
    expect(screen.getByText('Average product')).toBeInTheDocument();
    
    // Check if average rating is displayed
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument(); // (5 + 4 + 3) / 3 = 4.0
    
    // Check if review count is displayed
    expect(screen.getByText('(3 reviews)')).toBeInTheDocument();
    
    // Check if rating distribution is displayed
    const ratingBars = screen.getAllByRole('progressbar');
    expect(ratingBars).toHaveLength(5); // 5 rating bars (1-5 stars)
  });
  
  it('renders seller reviews correctly', () => {
    render(<ReviewList reviews={mockSellerReviews} showSeller={true} />);
    
    // Check if review cards are rendered
    const reviewCards = screen.getAllByTestId('review-card');
    expect(reviewCards).toHaveLength(2);
    
    // Check if reviewer names are rendered
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    
    // Check if review comments are rendered
    expect(screen.getByText('Great seller!')).toBeInTheDocument();
    expect(screen.getByText('Good seller')).toBeInTheDocument();
    
    // Check if seller names are rendered
    const sellerNames = screen.getAllByTestId('seller-name');
    expect(sellerNames).toHaveLength(2);
    expect(sellerNames[0]).toHaveTextContent('Shop Name');
    
    // Check if average rating is displayed
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument(); // (5 + 4) / 2 = 4.5
    
    // Check if review count is displayed
    expect(screen.getByText('(2 reviews)')).toBeInTheDocument();
  });
  
  it('renders mixed product and seller reviews correctly', () => {
    render(
      <ReviewList
        reviews={mockProductAndSellerReviews}
        showProduct={true}
        showSeller={true}
      />
    );
    
    // Check if review cards are rendered
    const reviewCards = screen.getAllByTestId('review-card');
    expect(reviewCards).toHaveLength(2);
    
    // Check if product title is rendered
    expect(screen.getByTestId('product-title')).toHaveTextContent('Product Title');
    
    // Check if seller name is rendered
    expect(screen.getByTestId('seller-name')).toHaveTextContent('Shop Name');
    
    // Check if average rating is displayed
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument(); // (5 + 5) / 2 = 5.0
    
    // Check if review count is displayed
    expect(screen.getByText('(2 reviews)')).toBeInTheDocument();
  });
  
  it('renders empty state when no reviews exist', () => {
    render(<ReviewList reviews={[]} emptyMessage="No reviews yet" />);
    
    // Check if empty state message is displayed
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    
    // Check that no review cards are rendered
    expect(screen.queryByTestId('review-card')).not.toBeInTheDocument();
    
    // Check that rating summary is not displayed
    expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
  });
  
  it('renders singular review count when only one review exists', () => {
    render(<ReviewList reviews={[mockProductReviews[0]]} />);
    
    // Check if singular review count is displayed
    expect(screen.getByText('(1 review)')).toBeInTheDocument();
  });
  
  it('handles custom empty message', () => {
    render(<ReviewList reviews={[]} emptyMessage="Be the first to leave a review!" />);
    
    // Check if custom empty message is displayed
    expect(screen.getByText('Be the first to leave a review!')).toBeInTheDocument();
  });
  
  it('calculates rating distribution correctly', () => {
    const mixedRatingReviews = [
      { ...mockProductReviews[0], rating: 5 }, // 5 stars
      { ...mockProductReviews[1], rating: 5 }, // 5 stars
      { ...mockProductReviews[2], rating: 4 }, // 4 stars
      { ...mockSellerReviews[0], rating: 3 }, // 3 stars
      { ...mockSellerReviews[1], rating: 1 }, // 1 star
    ];
    
    render(<ReviewList reviews={mixedRatingReviews} />);
    
    // Check if average rating is displayed correctly
    expect(screen.getByText('3.6')).toBeInTheDocument(); // (5 + 5 + 4 + 3 + 1) / 5 = 3.6
    
    // Check if review count is displayed correctly
    expect(screen.getByText('(5 reviews)')).toBeInTheDocument();
    
    // Check rating distribution
    // We can't easily check the width of the progress bars, but we can check the count values
    const counts = screen.getAllByText(/^\d+$/); // Match text that is just a number
    
    // Find the counts for each rating (5 to 1 stars)
    const countValues = counts.map(el => parseInt(el.textContent));
    
    // Check if the distribution is correct
    expect(countValues).toContain(2); // Two 5-star reviews
    expect(countValues).toContain(1); // One 4-star review
    expect(countValues).toContain(1); // One 3-star review
    expect(countValues).toContain(0); // No 2-star reviews
    expect(countValues).toContain(1); // One 1-star review
  });
});
