import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary
 * @param file The file to upload (base64 encoded string)
 * @param folder Optional folder to upload to
 * @returns The Cloudinary upload response
 */
export async function uploadImage(
  file: string,
  folder: string = 'vowswap'
): Promise<{ url: string; publicId: string }> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Deletes an image from Cloudinary
 * @param publicId The public ID of the image to delete
 * @returns The Cloudinary deletion response
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Optimizes an image URL for responsive display
 * @param url The original Cloudinary URL
 * @param width The desired width
 * @param height The desired height (optional)
 * @param quality The image quality (1-100)
 * @returns The optimized image URL
 */
export function optimizeImage(
  url: string,
  width: number,
  height?: number,
  quality: number = 80
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Extract base URL and file path
  const [baseUrl, filePath] = url.split('/upload/');
  
  // Build transformation string
  let transformation = `c_fill,w_${width}`;
  if (height) transformation += `,h_${height}`;
  transformation += `,q_${quality}`;

  // Return optimized URL
  return `${baseUrl}/upload/${transformation}/${filePath}`;
}
