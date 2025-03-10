import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductReviews from '@/components/review/ProductReviews';
import { useSession } from 'next-auth/react';
import { useReviewStore } from '@/store/reviewStore';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock the review store
jest.mock('@/store/reviewStore', () => ({
  useReviewStore: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ProductReviews Component', () => {
  const mockProductId = 'product-1';
  
  const mockReviews = [
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
    }
  ];
  
  const mockSetProductReviews = jest.fn();
  const mockGetProductReviews = jest.fn().mockReturnValue(mockReviews);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useSession
    useSession.mockReturnValue({
      data: {
        user: {
          id: 'user-3',
          name: 'Test User',
          email: 'test@example.com'
        }
      },
      status: 'authenticated'
    });
    
    // Mock useReviewStore
    useReviewStore.mockReturnValue({
      setProductReviews: mockSetProductReviews,
      getProductReviews: mockGetProductReviews
    });
    
    // Mock successful fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockReviews
    });
  });
  
  it('renders loading state initially', () => {
    render(<ProductReviews productId={mockProductId} />);
    
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
  });
  
  it('renders reviews after loading', async () => {
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
    });
    
    // Check if reviews are rendered
    expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    expect(screen.getByText('Great product!')).toBeInTheDocument();
    expect(screen.getByText('Good product')).toBeInTheDocument();
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith(`/api/reviews/product/${mockProductId}`);
    
    // Verify store was updated
    expect(mockSetProductReviews).toHaveBeenCalledWith(mockProductId, mockReviews);
  });
  
  it('shows write review button for authenticated users who have not reviewed', async () => {
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
    });
    
    // Check if write review button is rendered
    expect(screen.getByRole('button', { name: /write a review/i })).toBeInTheDocument();
  });
  
  it('hides write review button for users who have already reviewed', async () => {
    // Mock user who has already reviewed
    useSession.mockReturnValue({
      data: {
        user: {
          id: 'user-1', // Same as reviewerId in mockReviews[0]
          name: 'User 1',
          email: 'user1@example.com'
        }
      },
      status: 'authenticated'
    });
    
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
    });
    
    // Check if write review button is not rendered
    expect(screen.queryByRole('button', { name: /write a review/i })).not.toBeInTheDocument();
  });
  
  it('hides write review button for unauthenticated users', async () => {
    // Mock unauthenticated session
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });
    
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
    });
    
    // Check if write review button is not rendered
    expect(screen.queryByRole('button', { name: /write a review/i })).not.toBeInTheDocument();
  });
  
  it('shows review form when write review button is clicked', async () => {
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
    });
    
    // Click write review button
    fireEvent.click(screen.getByRole('button', { name: /write a review/i }));
    
    // Check if review form is rendered
    expect(screen.getByText(/review this product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
  });
  
  it('handles review submission success', async () => {
    // Mock successful review submission
    global.fetch.mockImplementation(async (url) => {
      if (url === `/api/reviews/product/${mockProductId}`) {
        return {
          ok: true,
          json: async () => mockReviews
        };
      } else {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: 'new-review',
            productId: mockProductId,
            reviewerId: 'user-3',
            reviewerName: 'Test User',
            rating: 5,
            comment: 'Excellent product!',
            createdAt: '2025-01-03T00:00:00.000Z',
            updatedAt: '2025-01-03T00:00:00.000Z'
          })
        };
      }
    });
    
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
    });
    
    // Click write review button
    fireEvent.click(screen.getByRole('button', { name: /write a review/i }));
    
    // Fill out review form
    // Note: The actual star rating interaction might be complex depending on implementation
    // For simplicity, we're assuming the form has a direct rating input
    const ratingInput = screen.getByLabelText(/rating/i);
    const commentInput = screen.getByLabelText(/your review/i);
    
    fireEvent.change(ratingInput, { target: { value: '5' } });
    fireEvent.change(commentInput, { target: { value: 'Excellent product!' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }));
    
    // Wait for submission to complete and reviews to refresh
    await waitFor(() => {
      // Verify fetch was called for submission
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/reviews/product/${mockProductId}`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      );
    });
    
    // Verify reviews were refreshed
    expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + submission
  });
  
  it('handles fetch error', async () => {
    // Mock fetch error
    global.fetch.mockRejectedValueOnce(new Error('Failed to fetch reviews'));
    
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText(/failed to load reviews/i)).toBeInTheDocument();
    });
  });
  
  it('displays empty state when no reviews exist', async () => {
    // Mock empty reviews response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    render(<ProductReviews productId={mockProductId} />);
    
    // Wait for reviews to load
    await waitFor(() => {
      expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
    });
    
    // Check if empty state message is displayed
    expect(screen.getByText(/be the first to review this product/i)).toBeInTheDocument();
  });
});
