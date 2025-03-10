import { NextRequest } from 'next/server';
import { POST as uploadHandler } from '@/app/api/upload/route';
import { getServerSession } from 'next-auth';
import { uploadImage } from '@/lib/cloudinary';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}));

// Mock the cloudinary module
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockImplementation(() => {
        return Promise.resolve({
          secure_url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/uploads/abcdef123456.jpg',
          public_id: 'uploads/abcdef123456'
        });
      }),
      destroy: jest.fn()
    }
  }
}));

// Mock the uploadImage function from lib/cloudinary
jest.mock('@/lib/cloudinary', () => ({
  uploadImage: jest.fn().mockImplementation((file, folder) => {
    return Promise.resolve({
      url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/uploads/abcdef123456.jpg',
      publicId: 'uploads/abcdef123456'
    });
  }),
  deleteImage: jest.fn(),
  optimizeImage: jest.fn()
}));

// Helper to create a mock file
const createMockFile = (name, type, content = 'file contents') => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  return file;
};

// Helper to create a mock FormData
const createMockFormData = (file, folder = 'vowswap') => {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }
  return formData;
};

// Mock NextRequest with formData
const mockRequest = (formData) => {
  const req = new NextRequest('http://localhost:3000/api/upload', {
    method: 'POST',
  });
  
  // Mock the formData method
  req.formData = jest.fn().mockResolvedValue(formData);
  
  return req;
};

describe('Upload API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/upload', () => {
    it('should upload a file when authenticated', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Create mock file and form data
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      const formData = createMockFormData(mockFile);
      
      // Create request
      const req = mockRequest(formData);
      
      // Call the handler
      const response = await uploadHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.url).toBe('https://res.cloudinary.com/demo/image/upload/v1234567890/uploads/abcdef123456.jpg');
      expect(responseData.publicId).toBe('uploads/abcdef123456');
      
      // Verify uploadImage was called with correct parameters
      expect(uploadImage).toHaveBeenCalledWith(expect.any(String), 'vowswap');
    });
    
    it('should reject upload when not authenticated', async () => {
      // Mock unauthenticated session
      getServerSession.mockResolvedValueOnce(null);
      
      // Create mock file and form data
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      const formData = createMockFormData(mockFile);
      
      // Create request
      const req = mockRequest(formData);
      
      // Call the handler
      const response = await uploadHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('Unauthorized');
      
      // Verify uploadImage was not called
      expect(uploadImage).not.toHaveBeenCalled();
    });
    
    it('should handle missing file in request', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Create empty FormData (no file)
      const formData = new FormData();
      
      // Create request
      const req = mockRequest(formData);
      
      // Call the handler
      const response = await uploadHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('No file provided');
      
      // Verify uploadImage was not called
      expect(uploadImage).not.toHaveBeenCalled();
    });
    
    it('should handle cloudinary upload errors', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Create mock file and form data
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      const formData = createMockFormData(mockFile);
      
      // Mock uploadImage to throw an error
      uploadImage.mockRejectedValueOnce(new Error('Failed to upload image to Cloudinary'));
      
      // Create request
      const req = mockRequest(formData);
      
      // Call the handler
      const response = await uploadHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(500);
      expect(responseData.error).toContain('Failed to upload image to Cloudinary');
    });
    
    it('should handle unsupported file types', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Create mock file with unsupported type and form data
      const mockFile = createMockFile('test-document.pdf', 'application/pdf');
      const formData = createMockFormData(mockFile);
      
      // Create request
      const req = mockRequest(formData);
      
      // Call the handler
      const response = await uploadHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('Unsupported file type');
      
      // Verify uploadImage was not called
      expect(uploadImage).not.toHaveBeenCalled();
    });
    
    it('should use custom folder when provided', async () => {
      // Mock authenticated session
      getServerSession.mockResolvedValueOnce({
        user: {
          id: 'user-1',
          email: 'user@example.com'
        }
      });
      
      // Create mock file and form data with custom folder
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      const formData = createMockFormData(mockFile, 'custom-folder');
      
      // Create request
      const req = mockRequest(formData);
      
      // Call the handler
      const response = await uploadHandler(req);
      const responseData = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Verify uploadImage was called with custom folder
      expect(uploadImage).toHaveBeenCalledWith(expect.any(String), 'custom-folder');
    });
  });
});
