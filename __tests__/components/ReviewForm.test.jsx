import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '@/components/review/ReviewForm';
import { useSession } from 'next-auth/react';
import { useReviewStore } from '@/store/reviewStore';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock the review store
jest.mock('@/store/reviewStore', () => ({
  useReviewStore: jest.fn(),
}));

// Mock the StarRating component
jest.mock('@/components/review/StarRating', () => {
  return function MockStarRating({ rating, onChange }) {
    return (
      <div data-testid="star-rating">
        <input
          type="range"
          min="0"
          max="5"
          value={rating}
          onChange={(e) => onChange(parseInt(e.target.value))}
          data-testid="star-rating-input"
        />
        <span>Current rating: {rating}</span>
      </div>
    );
  };
});

describe('ReviewForm Component', () => {
  const mockProductId = 'product-123';
  const mockSellerId = 'seller-456';
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  
  const mockAddProductReview = jest.fn();
  const mockAddSellerReview = jest.fn();
  
  // Mock fetch
  global.fetch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'review-123', rating: 4, comment: 'Great product!' }),
    });
    
    // Mock authenticated session
    useSession.mockReturnValue({
      data: { user: { name: 'Test User', email: 'test@example.com' } },
    });
    
    // Mock review store
    useReviewStore.mockReturnValue({
      addProductReview: mockAddProductReview,
      addSellerReview: mockAddSellerReview,
    });
  });
  
  it('renders sign in message when user is not authenticated', () => {
    // Mock unauthenticated session
    useSession.mockReturnValue({
      data: null,
    });
    
    render(<ReviewForm productId={mockProductId} />);
    
    // Use a more flexible approach to find text that's split across elements
    const signInText = screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'p' && 
        element.textContent.includes('Please') && 
        element.textContent.includes('sign in') && 
        element.textContent.includes('to leave a review');
    });
    
    expect(signInText).toBeInTheDocument();
    expect(screen.getByText('sign in')).toHaveAttribute('href', '/auth/signin');
  });
  
  it('renders product review form correctly when authenticated', () => {
    render(<ReviewForm productId={mockProductId} />);
    
    expect(screen.getByText('Review this product')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Review (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
  });
  
  it('renders seller review form correctly when authenticated', () => {
    render(<ReviewForm sellerId={mockSellerId} />);
    
    expect(screen.getByText('Review this seller')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Review (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Review' })).toBeInTheDocument();
  });
  
  it('shows cancel button when onCancel prop is provided', () => {
    render(<ReviewForm productId={mockProductId} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
    
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalled();
  });
  
  it('validates that rating is required', async () => {
    render(<ReviewForm productId={mockProductId} />);
    
    // Submit without selecting a rating
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check for validation error
    expect(screen.getByText('Please select a rating')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
  
  it('submits product review successfully', async () => {
    render(<ReviewForm productId={mockProductId} onSuccess={mockOnSuccess} />);
    
    // Set rating to 4
    fireEvent.change(screen.getByTestId('star-rating-input'), { target: { value: '4' } });
    
    // Add a comment
    fireEvent.change(screen.getByLabelText('Your Review (optional)'), {
      target: { value: 'Great product!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check that fetch was called with the correct URL and data
    expect(fetch).toHaveBeenCalledWith(
      `/api/reviews/product/${mockProductId}`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 4,
          comment: 'Great product!',
        }),
      })
    );
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(mockAddProductReview).toHaveBeenCalledWith(
        mockProductId,
        expect.objectContaining({
          id: 'review-123',
          rating: 4,
          comment: 'Great product!',
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
  
  it('submits seller review successfully', async () => {
    render(<ReviewForm sellerId={mockSellerId} onSuccess={mockOnSuccess} />);
    
    // Set rating to 5
    fireEvent.change(screen.getByTestId('star-rating-input'), { target: { value: '5' } });
    
    // Add a comment
    fireEvent.change(screen.getByLabelText('Your Review (optional)'), {
      target: { value: 'Excellent seller!' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check that fetch was called with the correct URL and data
    expect(fetch).toHaveBeenCalledWith(
      `/api/reviews/seller/${mockSellerId}`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 5,
          comment: 'Excellent seller!',
        }),
      })
    );
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(mockAddSellerReview).toHaveBeenCalledWith(
        mockSellerId,
        expect.objectContaining({
          id: 'review-123',
          rating: 4,
          comment: 'Great product!',
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
  
  it('handles API error during submission', async () => {
    // Mock API error
    fetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'You have already reviewed this product' }),
    });
    
    render(<ReviewForm productId={mockProductId} />);
    
    // Set rating to 3
    fireEvent.change(screen.getByTestId('star-rating-input'), { target: { value: '3' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('You have already reviewed this product')).toBeInTheDocument();
    });
    
    // Check that the store was not updated
    expect(mockAddProductReview).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
  
  it('handles network error during submission', async () => {
    // Mock network error
    fetch.mockRejectedValue(new Error('Network error'));
    
    render(<ReviewForm productId={mockProductId} />);
    
    // Set rating to 3
    fireEvent.change(screen.getByTestId('star-rating-input'), { target: { value: '3' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    // Check that the store was not updated
    expect(mockAddProductReview).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
  
  it('shows loading state during submission', async () => {
    render(<ReviewForm productId={mockProductId} />);
    
    // Set rating to 4
    fireEvent.change(screen.getByTestId('star-rating-input'), { target: { value: '4' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check that the button shows loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(mockAddProductReview).toHaveBeenCalled();
    });
  });
  
  it('validates that either productId or sellerId must be provided', () => {
    // Mock console.error to prevent React from logging errors
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Render without productId or sellerId
    render(<ReviewForm />);
    
    // Set rating to 4
    fireEvent.change(screen.getByTestId('star-rating-input'), { target: { value: '4' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit Review' }));
    
    // Check for validation error
    expect(screen.getByText('Invalid review target')).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
