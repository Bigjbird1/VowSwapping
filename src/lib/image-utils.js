/**
 * Utility functions for handling images
 */

/**
 * Ensures an image path is properly formatted for Next.js Image component
 * @param {string} path - The image path
 * @returns {string} - Properly formatted image path
 */
export function formatImagePath(path) {
  if (!path) {
    return '/images/placeholder.jpg';
  }
  
  // If it's already an absolute URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it doesn't start with a slash, add one
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  
  return path;
}

/**
 * Processes an image array to ensure all paths are properly formatted
 * @param {string|string[]} images - Image or array of images
 * @returns {string[]} - Array of properly formatted image paths
 */
export function processImageArray(images) {
  // Handle potentially malformed images array
  let imageArray = images;
  
  if (typeof images === 'string') {
    try {
      // Try to parse if it's a JSON string
      imageArray = JSON.parse(images);
    } catch (e) {
      // If parsing fails, use a single-item array with the string
      imageArray = [images];
    }
  }
  
  // Ensure imageArray is an array
  if (!Array.isArray(imageArray)) {
    imageArray = imageArray ? [imageArray] : [];
  }
  
  // Format each image path
  return imageArray.map(formatImagePath);
}

/**
 * Gets a default image if the provided image array is empty
 * @param {string[]} images - Array of image paths
 * @param {string} defaultImage - Default image path
 * @returns {string} - Image path to use
 */
export function getDefaultImage(images, defaultImage = '/images/placeholder.jpg') {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return defaultImage;
  }
  
  return images[0];
}
