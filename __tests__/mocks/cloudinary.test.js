/**
 * Tests for cloudinary.js mock
 */

import cloudinaryMock, {
  cloudinary,
  CloudinaryError,
  CloudinaryResourceNotFoundError,
  CloudinaryUploadError,
  mockSuccessfulUpload,
  mockFailedUpload,
  mockSuccessfulDeletion,
  mockFailedDeletion
} from './cloudinary';

describe('Cloudinary Mock', () => {
  describe('cloudinary API', () => {
    it('should have uploader methods', () => {
      expect(cloudinary.uploader.upload).toBeDefined();
      expect(cloudinary.uploader.destroy).toBeDefined();
      expect(cloudinary.uploader.rename).toBeDefined();
    });

    it('should have api methods', () => {
      expect(cloudinary.api.resources).toBeDefined();
      expect(cloudinary.api.resource).toBeDefined();
      expect(cloudinary.api.delete_resources).toBeDefined();
    });

    it('should have url method', () => {
      expect(cloudinary.url).toBeDefined();
    });

    it('should have config method', () => {
      expect(cloudinary.config).toBeDefined();
    });

    it('should generate URLs correctly', () => {
      const url = cloudinary.url('test-image');
      expect(url).toBe('https://res.cloudinary.com/demo/image/upload/test-image');
    });
  });

  describe('uploader.upload', () => {
    it('should return a successful upload response by default', async () => {
      const result = await cloudinary.uploader.upload('test-file');
      
      expect(result.secure_url).toBeDefined();
      expect(result.public_id).toBeDefined();
      expect(result.asset_id).toBeDefined();
      expect(result.format).toBe('jpg');
      expect(result.resource_type).toBe('image');
    });

    it('should allow mocking a custom upload response', async () => {
      mockSuccessfulUpload({
        public_id: 'custom-id',
        format: 'png',
        width: 1200,
        height: 800
      });
      
      const result = await cloudinary.uploader.upload('test-file');
      
      expect(result.public_id).toBe('custom-id');
      expect(result.format).toBe('png');
      expect(result.width).toBe(1200);
      expect(result.height).toBe(800);
    });

    it('should allow mocking a failed upload', async () => {
      mockFailedUpload('File too large');
      
      await expect(cloudinary.uploader.upload('test-file'))
        .rejects.toThrow('File too large');
      
      await expect(cloudinary.uploader.upload('test-file'))
        .rejects.toBeInstanceOf(CloudinaryUploadError);
    });
  });

  describe('uploader.destroy', () => {
    it('should return a successful deletion response by default', async () => {
      const result = await cloudinary.uploader.destroy('test-id');
      
      expect(result.result).toBe('ok');
    });

    it('should allow mocking a successful deletion', async () => {
      mockSuccessfulDeletion();
      
      const result = await cloudinary.uploader.destroy('test-id');
      
      expect(result.result).toBe('ok');
    });

    it('should allow mocking a failed deletion', async () => {
      mockFailedDeletion('Resource not found');
      
      await expect(cloudinary.uploader.destroy('test-id'))
        .rejects.toThrow('Resource not found');
      
      await expect(cloudinary.uploader.destroy('test-id'))
        .rejects.toBeInstanceOf(CloudinaryError);
    });
  });

  describe('uploader.rename', () => {
    it('should return a successful rename response', async () => {
      const result = await cloudinary.uploader.rename('old-id', 'new-id');
      
      expect(result.public_id).toBe('mock-new-public-id');
    });
  });

  describe('api methods', () => {
    it('should return resources list', async () => {
      const result = await cloudinary.api.resources();
      
      expect(result.resources).toEqual([]);
    });

    it('should return resource details', async () => {
      const result = await cloudinary.api.resource('test-id');
      
      expect(result.public_id).toBe('mock-public-id');
      expect(result.secure_url).toBeDefined();
    });

    it('should return deletion results', async () => {
      const result = await cloudinary.api.delete_resources(['test-id']);
      
      expect(result.deleted).toBeDefined();
      expect(result.deleted['mock-public-id']).toBe('deleted');
    });
  });

  describe('Error Classes', () => {
    it('should create a base CloudinaryError', () => {
      const error = new CloudinaryError('Generic error');
      
      expect(error.name).toBe('CloudinaryError');
      expect(error.message).toBe('Generic error');
      expect(error instanceof Error).toBe(true);
    });

    it('should create a CloudinaryResourceNotFoundError', () => {
      const error = new CloudinaryResourceNotFoundError('missing-image');
      
      expect(error.name).toBe('CloudinaryResourceNotFoundError');
      expect(error.message).toBe('Resource not found: missing-image');
      expect(error instanceof CloudinaryError).toBe(true);
    });

    it('should create a CloudinaryUploadError', () => {
      const error = new CloudinaryUploadError('Upload failed: invalid format');
      
      expect(error.name).toBe('CloudinaryUploadError');
      expect(error.message).toBe('Upload failed: invalid format');
      expect(error instanceof CloudinaryError).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    it('mockSuccessfulUpload should set a one-time success response', async () => {
      mockSuccessfulUpload({ public_id: 'success-id' });
      
      // First call should use the mocked response
      const result1 = await cloudinary.uploader.upload('test-file');
      expect(result1.public_id).toBe('success-id');
      
      // Second call should use the default response
      const result2 = await cloudinary.uploader.upload('test-file');
      expect(result2.public_id).toBe('mock-public-id');
    });

    it('mockFailedUpload should set a one-time failure response', async () => {
      mockFailedUpload('Custom error');
      
      // First call should fail
      await expect(cloudinary.uploader.upload('test-file'))
        .rejects.toThrow('Custom error');
      
      // Second call should succeed
      const result = await cloudinary.uploader.upload('test-file');
      expect(result.public_id).toBeDefined();
    });

    it('mockSuccessfulDeletion should set a one-time success response', async () => {
      // Override the default implementation first
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Default error'));
      
      mockSuccessfulDeletion();
      
      // First call should succeed
      const result = await cloudinary.uploader.destroy('test-id');
      expect(result.result).toBe('ok');
      
      // Second call should use the default (error in this case)
      await expect(cloudinary.uploader.destroy('test-id'))
        .rejects.toThrow('Default error');
    });

    it('mockFailedDeletion should set a one-time failure response', async () => {
      mockFailedDeletion('Resource locked');
      
      // First call should fail
      await expect(cloudinary.uploader.destroy('test-id'))
        .rejects.toThrow('Resource locked');
      
      // Second call should succeed
      const result = await cloudinary.uploader.destroy('test-id');
      expect(result.result).toBe('ok');
    });
  });

  describe('Default Export', () => {
    it('should export v2 as cloudinary', () => {
      expect(cloudinaryMock.v2).toBe(cloudinary);
    });

    it('should export error classes', () => {
      expect(cloudinaryMock.CloudinaryError).toBe(CloudinaryError);
      expect(cloudinaryMock.CloudinaryResourceNotFoundError).toBe(CloudinaryResourceNotFoundError);
      expect(cloudinaryMock.CloudinaryUploadError).toBe(CloudinaryUploadError);
    });

    it('should export helper functions', () => {
      expect(cloudinaryMock.mockSuccessfulUpload).toBe(mockSuccessfulUpload);
      expect(cloudinaryMock.mockFailedUpload).toBe(mockFailedUpload);
      expect(cloudinaryMock.mockSuccessfulDeletion).toBe(mockSuccessfulDeletion);
      expect(cloudinaryMock.mockFailedDeletion).toBe(mockFailedDeletion);
    });
  });
});
