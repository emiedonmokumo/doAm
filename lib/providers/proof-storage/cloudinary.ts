import { v2 as cloudinary } from 'cloudinary';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maximumBytes = 5 * 1024 * 1024;

export async function storeTaskProof(file: File, taskId: string) {
  if (!allowedTypes.has(file.type)) throw new Error('Upload a JPEG, PNG, or WebP image.');
  if (file.size < 1 || file.size > maximumBytes) throw new Error('Proof images must be 5 MB or smaller.');
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new Error('Proof uploads are not configured.');
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const uploaded = await cloudinary.uploader.upload(`data:${file.type};base64,${base64}`, {
    folder: `doam/tasks/${taskId}/proof`, resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });
  return { url: uploaded.secure_url, publicId: uploaded.public_id };
}

export async function removeTaskProof(publicId: string) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return;
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
