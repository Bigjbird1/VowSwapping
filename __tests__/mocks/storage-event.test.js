/**
 * Tests for storage-event.js mock
 */

import {
  MockStorageEvent,
  dispatchStorageEvent,
  patchStorageEvent
} from './storage-event';

describe('Storage Event Mock', () => {
  describe('MockStorageEvent', () => {
    it('should create a storage event with default values', () => {
      const event = new MockStorageEvent('storage');
      
      expect(event.type).toBe('storage');
      expect(event.key).toBeNull();
      expect(event.newValue).toBeNull();
      expect(event.oldValue).toBeNull();
      expect(event.storageArea).toBeNull();
      expect(event.url).toBe(window.location.href);
    });

    it('should create a storage event with provided values', () => {
      const eventInit = {
        key: 'testKey',
        newValue: 'newValue',
        oldValue: 'oldValue',
        storageArea: localStorage,
        url: 'https://example.com'
      };
      
      const event = new MockStorageEvent('storage', eventInit);
      
      expect(event.type).toBe('storage');
      expect(event.key).toBe('testKey');
      expect(event.newValue).toBe('newValue');
      expect(event.oldValue).toBe('oldValue');
      expect(event.storageArea).toBe(localStorage);
      expect(event.url).toBe('https://example.com');
    });
  });

  describe('dispatchStorageEvent', () => {
    it('should create and dispatch a storage event', () => {
      // Mock window.dispatchEvent
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = jest.fn();
      
      try {
        const event = dispatchStorageEvent('testKey', 'newValue', 'oldValue', localStorage);
        
        expect(window.dispatchEvent).toHaveBeenCalledWith(event);
        expect(event.key).toBe('testKey');
        expect(event.newValue).toBe('newValue');
        expect(event.oldValue).toBe('oldValue');
        expect(event.storageArea).toBe(localStorage);
      } finally {
        // Restore original
        window.dispatchEvent = originalDispatchEvent;
      }
    });

    it('should use default values when not provided', () => {
      // Mock window.dispatchEvent
      const originalDispatchEvent = window.dispatchEvent;
      window.dispatchEvent = jest.fn();
      
      try {
        const event = dispatchStorageEvent('testKey', 'newValue');
        
        expect(window.dispatchEvent).toHaveBeenCalledWith(event);
        expect(event.key).toBe('testKey');
        expect(event.newValue).toBe('newValue');
        expect(event.oldValue).toBeNull();
        expect(event.storageArea).toBe(localStorage);
      } finally {
        // Restore original
        window.dispatchEvent = originalDispatchEvent;
      }
    });
  });

  describe('patchStorageEvent', () => {
    it('should replace global StorageEvent with MockStorageEvent', () => {
      // Save original
      const originalStorageEvent = global.StorageEvent;
      
      try {
        // Patch
        const unpatch = patchStorageEvent();
        
        // Verify patched
        expect(global.StorageEvent).toBe(MockStorageEvent);
        
        // Unpatch
        unpatch();
        
        // Verify unpatched
        expect(global.StorageEvent).toBe(originalStorageEvent);
      } finally {
        // Ensure original is restored even if test fails
        global.StorageEvent = originalStorageEvent;
      }
    });

    it('should allow creating storage events after patching', () => {
      // Save original
      const originalStorageEvent = global.StorageEvent;
      
      try {
        // Patch
        const unpatch = patchStorageEvent();
        
        // Create event using global constructor
        const event = new StorageEvent('storage', {
          key: 'testKey',
          newValue: 'newValue'
        });
        
        // Verify it's our mock
        expect(event instanceof MockStorageEvent).toBe(true);
        expect(event.key).toBe('testKey');
        expect(event.newValue).toBe('newValue');
        
        // Unpatch
        unpatch();
      } finally {
        // Ensure original is restored even if test fails
        global.StorageEvent = originalStorageEvent;
      }
    });
  });

  describe('Integration', () => {
    it('should allow listening for storage events', () => {
      // Save original
      const originalStorageEvent = global.StorageEvent;
      const originalDispatchEvent = window.dispatchEvent;
      
      try {
        // Patch
        patchStorageEvent();
        
        // Set up listener
        const listener = jest.fn();
        window.addEventListener('storage', listener);
        
        // Mock dispatchEvent to actually call listeners
        window.dispatchEvent = jest.fn().mockImplementation((event) => {
          if (event.type === 'storage') {
            listener(event);
          }
          return true;
        });
        
        // Dispatch event
        dispatchStorageEvent('testKey', 'newValue', 'oldValue');
        
        // Verify listener was called with correct event
        expect(listener).toHaveBeenCalledTimes(1);
        const event = listener.mock.calls[0][0];
        expect(event.key).toBe('testKey');
        expect(event.newValue).toBe('newValue');
        expect(event.oldValue).toBe('oldValue');
        
        // Clean up
        window.removeEventListener('storage', listener);
      } finally {
        // Restore originals
        global.StorageEvent = originalStorageEvent;
        window.dispatchEvent = originalDispatchEvent;
      }
    });
  });
});
