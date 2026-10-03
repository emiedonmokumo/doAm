import { getCloudinary, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_TASK_IMAGES } from '@/lib/config/cloudinary';

export { MAX_TASK_IMAGES };

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Upload a JPEG, PNG, or WebP image.');
  }
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('Images must be 5 MB or smaller.');
  }
}

async function fileToDataUri(file: File): Promise<string> {
  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  return `data:${file.type};base64,${base64}`;
}

/**
 * Upload single completion proof photo for a task.
 */
export async function storeTaskProof(file: File, taskId: string) {
  validateImageFile(file);
  const cloudinary = getCloudinary();
  const dataUri = await fileToDataUri(file);

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: `doam/tasks/${taskId}/proof`,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  });

  return { url: uploaded.secure_url, publicId: uploaded.public_id };
}

/**
 * Remove a single proof photo from Cloudinary.
 */
export async function removeTaskProof(publicId: string) {
  if (!publicId) return;
  try {
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Upload multiple task attachment photos (up to MAX_TASK_IMAGES).
 */
export async function storeTaskImages(files: File[], taskId: string) {
  if (files.length > MAX_TASK_IMAGES) {
    throw new Error(`You can attach up to ${MAX_TASK_IMAGES} images.`);
  }

  for (const file of files) {
    validateImageFile(file);
  }

  const cloudinary = getCloudinary();

  const uploads = await Promise.all(
    files.map(async (file, order) => {
      const dataUri = await fileToDataUri(file);
      const uploaded = await cloudinary.uploader.upload(dataUri, {
        folder: `doam/tasks/${taskId}/attachments`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      });
      return { url: uploaded.secure_url, publicId: uploaded.public_id, order };
    })
  );

  return uploads;
}

/**
 * Remove multiple task attachment photos from Cloudinary.
 */
export async function removeTaskImages(publicIds: string[]) {
  if (!publicIds.length) return;
  try {
    const cloudinary = getCloudinary();
    await Promise.all(
      publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => undefined)
      )
    );
  } catch {
    // Best-effort cleanup
  }
}
