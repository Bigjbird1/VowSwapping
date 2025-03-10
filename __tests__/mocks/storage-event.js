/**
 * Mock implementation of StorageEvent for testing
 * 
 * This is needed because JSDOM's StorageEvent implementation doesn't fully match the browser's
 * and causes issues in tests that use localStorage events.
 */

export class MockStorageEvent extends Event {
  constructor(type, eventInit = {}) {
    super(type);
    
    this.key = eventInit.key || null;
    this.newValue = eventInit.newValue || null;
    this.oldValue = eventInit.oldValue || null;
    this.storageArea = eventInit.storageArea || null;
    this.url = eventInit.url || window.location.href;
  }
}

/**
 * Creates a mock storage event and dispatches it
 * @param {string} key - The key that changed
 * @param {string} newValue - The new value
 * @param {string} oldValue - The old value
 * @param {Storage} storageArea - The storage area (localStorage or sessionStorage)
 */
export function dispatchStorageEvent(key, newValue, oldValue = null, storageArea = localStorage) {
  // Create the event
  const event = new MockStorageEvent('storage', {
    key,
    newValue,
    oldValue,
    storageArea,
    url: window.location.href,
  });
  
  // Dispatch the event
  window.dispatchEvent(event);
  
  return event;
}

/**
 * Patch the global StorageEvent constructor to use our mock implementation
 */
export function patchStorageEvent() {
  // Save the original constructor
  const originalStorageEvent = global.StorageEvent;
  
  // Replace with our mock implementation
  global.StorageEvent = MockStorageEvent;
  
  // Return a function to restore the original
  return function unpatch() {
    global.StorageEvent = originalStorageEvent;
  };
}
