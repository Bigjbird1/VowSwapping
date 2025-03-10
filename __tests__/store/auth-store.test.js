import { useAuthStore } from '@/store/authStore';
import { act } from '@testing-library/react';

describe('Auth Store', () => {
  // Reset the store before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the store state
    act(() => {
      useAuthStore.setState({
        user: null,
        isLoading: true,
      });
    });
  });
  
  describe('setUser', () => {
    it('should set the user', () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg'
      };
      
      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });
      
      const { user } = useAuthStore.getState();
      
      // Check if user was set correctly
      expect(user).toEqual(mockUser);
      expect(user.id).toBe('user-1');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.image).toBe('https://example.com/avatar.jpg');
    });
    
    it('should set the user to null when logging out', () => {
      // First set a user
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com'
      };
      
      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });
      
      // Verify user was set
      expect(useAuthStore.getState().user).toEqual(mockUser);
      
      // Now log out by setting user to null
      act(() => {
        useAuthStore.getState().setUser(null);
      });
      
      // Check if user was set to null
      expect(useAuthStore.getState().user).toBeNull();
    });
    
    it('should handle partial user data', () => {
      const partialUser = {
        id: 'user-1',
        // Missing name and image
        email: 'test@example.com'
      };
      
      act(() => {
        useAuthStore.getState().setUser(partialUser);
      });
      
      const { user } = useAuthStore.getState();
      
      // Check if user was set correctly with partial data
      expect(user).toEqual(partialUser);
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBeUndefined();
      expect(user.image).toBeUndefined();
    });
  });
  
  describe('setLoading', () => {
    it('should set the loading state to true', () => {
      // First set loading to false
      act(() => {
        useAuthStore.getState().setLoading(false);
      });
      
      // Verify loading was set to false
      expect(useAuthStore.getState().isLoading).toBe(false);
      
      // Now set loading to true
      act(() => {
        useAuthStore.getState().setLoading(true);
      });
      
      // Check if loading was set to true
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
    
    it('should set the loading state to false', () => {
      // First ensure loading is true (default state)
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      // Now set loading to false
      act(() => {
        useAuthStore.getState().setLoading(false);
      });
      
      // Check if loading was set to false
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
  
  describe('Initial State', () => {
    it('should have the correct initial state', () => {
      // Create a fresh store instance
      const initialState = useAuthStore.getState();
      
      // Check initial state
      expect(initialState.user).toBeNull();
      expect(initialState.isLoading).toBe(true);
    });
  });
  
  describe('Store Actions', () => {
    it('should handle a complete authentication flow', () => {
      // 1. Initial state (loading, no user)
      expect(useAuthStore.getState().isLoading).toBe(true);
      expect(useAuthStore.getState().user).toBeNull();
      
      // 2. Set loading to false (e.g., when checking session)
      act(() => {
        useAuthStore.getState().setLoading(false);
      });
      
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      
      // 3. Set loading to true (e.g., when signing in)
      act(() => {
        useAuthStore.getState().setLoading(true);
      });
      
      expect(useAuthStore.getState().isLoading).toBe(true);
      expect(useAuthStore.getState().user).toBeNull();
      
      // 4. Set user (e.g., after successful sign-in)
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com'
      };
      
      act(() => {
        useAuthStore.getState().setUser(mockUser);
        useAuthStore.getState().setLoading(false);
      });
      
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      
      // 5. Set loading to true (e.g., when signing out)
      act(() => {
        useAuthStore.getState().setLoading(true);
      });
      
      expect(useAuthStore.getState().isLoading).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      
      // 6. Set user to null (e.g., after successful sign-out)
      act(() => {
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setLoading(false);
      });
      
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
  
  describe('Store Selectors', () => {
    it('should correctly determine if user is authenticated', () => {
      // Create a selector function to check authentication status
      const isAuthenticated = (state) => state.user !== null;
      
      // Initially not authenticated
      expect(isAuthenticated(useAuthStore.getState())).toBe(false);
      
      // Set a user
      act(() => {
        useAuthStore.getState().setUser({
          id: 'user-1',
          name: 'Test User'
        });
      });
      
      // Now authenticated
      expect(isAuthenticated(useAuthStore.getState())).toBe(true);
      
      // Log out
      act(() => {
        useAuthStore.getState().setUser(null);
      });
      
      // No longer authenticated
      expect(isAuthenticated(useAuthStore.getState())).toBe(false);
    });
    
    it('should correctly determine if user is a seller', () => {
      // Create a selector function to check seller status
      const isSeller = (state) => state.user?.isSeller === true;
      
      // Initially not a seller (no user)
      expect(isSeller(useAuthStore.getState())).toBe(false);
      
      // Set a regular user
      act(() => {
        useAuthStore.getState().setUser({
          id: 'user-1',
          name: 'Test User',
          isSeller: false
        });
      });
      
      // Still not a seller
      expect(isSeller(useAuthStore.getState())).toBe(false);
      
      // Set a seller user
      act(() => {
        useAuthStore.getState().setUser({
          id: 'user-1',
          name: 'Test User',
          isSeller: true
        });
      });
      
      // Now a seller
      expect(isSeller(useAuthStore.getState())).toBe(true);
    });
  });
});
