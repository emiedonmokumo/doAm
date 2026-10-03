import { auth } from '@/auth';
import { apiError } from '@/lib/services/api';
import { createTask } from '@/lib/services/tasks';
import { createTaskSchema } from '@/lib/validation/tasks';
import { storeTaskImages, removeTaskImages, MAX_TASK_IMAGES } from '@/lib/providers/cloudinary';
import { randomUUID } from 'node:crypto';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);

  const contentType = request.headers.get('content-type') ?? '';
  let rawData: unknown;
  let imageFiles: File[] = [];

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const dataField = formData.get('data');
    if (typeof dataField === 'string') {
      try {
        rawData = JSON.parse(dataField);
      } catch {
        return apiError('VALIDATION_ERROR', 'Invalid task data payload.', 400);
      }
    } else {
      rawData = {
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        category: formData.get('category'),
        runnerFee: formData.get('runnerFee'),
        estimatedExpenses: formData.get('estimatedExpenses'),
        settlementMethod: formData.get('settlementMethod'),
        pickup: formData.get('pickup') ? JSON.parse(String(formData.get('pickup'))) : undefined,
        dropoff: formData.get('dropoff') ? JSON.parse(String(formData.get('dropoff'))) : undefined,
      };
    }

    const rawFiles = formData.getAll('images');
    imageFiles = rawFiles.filter((item): item is File => item instanceof File && item.size > 0);
    if (imageFiles.length > MAX_TASK_IMAGES) {
      return apiError('VALIDATION_ERROR', `You can attach up to ${MAX_TASK_IMAGES} photos.`, 400);
    }
  } else {
    try {
      rawData = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
    }
  }

  const parsed = createTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Check the task details and try again.', 400);
  }

  let uploadedImages: Array<{ url: string; publicId: string; order: number }> | undefined;
  const tempTaskId = randomUUID();

  try {
    if (imageFiles.length > 0) {
      uploadedImages = await storeTaskImages(imageFiles, tempTaskId);
    }
    const { task, handshakePin } = await createTask(session.user.id, parsed.data, uploadedImages);
    return Response.json({
      task: { id: task.id, status: task.status, images: task.images },
      handshake_pin: handshakePin,
    }, { status: 201 });
  } catch (error) {
    if (uploadedImages?.length) {
      await removeTaskImages(uploadedImages.map((img) => img.publicId)).catch(() => undefined);
    }
    console.error('[tasks/route] Error creating task:', error);
    return apiError('TASK_CREATE_FAILED', error instanceof Error ? error.message : 'Unable to create this task.', 400);
  }
}

