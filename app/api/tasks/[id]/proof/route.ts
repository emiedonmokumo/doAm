import { auth } from '@/auth';
import { assertTaskProofEligible, submitTaskProof } from '@/lib/services/tasks';
import { storeTaskProof, removeTaskProof } from '@/lib/providers/cloudinary';
import { apiError } from '@/lib/services/api';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHENTICATED', 'Sign in required.', 401);
  const { id } = await params;
  let uploaded: { url: string; publicId: string } | undefined;
  try {
    await assertTaskProofEligible(session.user.id, id);
    const form = await request.formData();
    const file = form.get('proof');
    if (!(file instanceof File)) return apiError('VALIDATION_ERROR', 'Choose a proof image.', 400);
    console.log(`[proof/route] Uploading proof for task ${id}: type=${file.type}, size=${file.size} bytes`);
    uploaded = await storeTaskProof(file, id);
    console.log(`[proof/route] Proof stored in Cloudinary for task ${id}:`, uploaded);
    const result = await submitTaskProof(session.user.id, id, uploaded);
    console.log(`[proof/route] Proof submitted successfully for task ${id}`);
    return Response.json(result);
  } catch (error) {
    console.error(`[proof/route] Proof submission failed for task ${id}:`, error);
    if (uploaded) await removeTaskProof(uploaded.publicId).catch(() => undefined);
    return apiError('PROOF_SUBMISSION_FAILED', error instanceof Error ? error.message : 'Unable to submit proof.', 409);
  }
}
