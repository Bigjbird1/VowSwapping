/**
 * Mock implementation of Cloudinary for testing
 */

// Mock Cloudinary v2 API
export const cloudinary = {
  config: jest.fn(),
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/mock-image.jpg',
      public_id: 'mock-public-id',
      asset_id: 'mock-asset-id',
      version_id: 'mock-version-id',
      version: 1,
      signature: 'mock-signature',
      width: 800,
      height: 600,
      format: 'jpg',
      resource_type: 'image',
      created_at: new Date().toISOString(),
      tags: [],
      bytes: 12345,
      type: 'upload',
      etag: 'mock-etag',
      url: 'http://res.cloudinary.com/demo/image/upload/mock-image.jpg',
      original_filename: 'mock-image',
    }),
    destroy: jest.fn().mockResolvedValue({
      result: 'ok'
    }),
    rename: jest.fn().mockResolvedValue({
      public_id: 'mock-new-public-id'
    }),
  },
  api: {
    resources: jest.fn().mockResolvedValue({
      resources: []
    }),
    resource: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/mock-image.jpg',
      public_id: 'mock-public-id',
    }),
    delete_resources: jest.fn().mockResolvedValue({
      deleted: { 'mock-public-id': 'deleted' }
    }),
  },
  url: jest.fn().mockImplementation((publicId) => {
    return `https://res.cloudinary.com/demo/image/upload/${publicId}`;
  }),
};

// Mock error classes
export class CloudinaryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CloudinaryError';
  }
}

export class CloudinaryResourceNotFoundError extends CloudinaryError {
  constructor(publicId) {
    super(`Resource not found: ${publicId}`);
    this.name = 'CloudinaryResourceNotFoundError';
  }
}

export class CloudinaryUploadError extends CloudinaryError {
  constructor(message) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

// Helper functions to simulate different responses
export const mockSuccessfulUpload = (customResponse = {}) => {
  cloudinary.uploader.upload.mockResolvedValueOnce({
    secure_url: 'https://res.cloudinary.com/demo/image/upload/mock-image.jpg',
    public_id: 'mock-public-id',
    ...customResponse
  });
};

export const mockFailedUpload = (errorMessage = 'Upload failed') => {
  cloudinary.uploader.upload.mockRejectedValueOnce(
    new CloudinaryUploadError(errorMessage)
  );
};

export const mockSuccessfulDeletion = () => {
  cloudinary.uploader.destroy.mockResolvedValueOnce({
    result: 'ok'
  });
};

export const mockFailedDeletion = (errorMessage = 'Deletion failed') => {
  cloudinary.uploader.destroy.mockRejectedValueOnce(
    new CloudinaryError(errorMessage)
  );
};

// Default export for jest.mock
export default {
  v2: cloudinary,
  CloudinaryError,
  CloudinaryResourceNotFoundError,
  CloudinaryUploadError,
  mockSuccessfulUpload,
  mockFailedUpload,
  mockSuccessfulDeletion,
  mockFailedDeletion,
};
