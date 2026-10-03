import { v2 as cloudinary } from 'cloudinary';

export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_TASK_IMAGES = 4;

let isConfigured = false;

/**
 * Returns the configured Cloudinary singleton.
 * Validates environment variables and trims accidental whitespace.
 */
export function getCloudinary() {
  if (!isConfigured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured.');
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME.trim(),
      api_key: CLOUDINARY_API_KEY.trim(),
      api_secret: CLOUDINARY_API_SECRET.trim(),
      secure: true,
    });
    isConfigured = true;
  }
  return cloudinary;
}
