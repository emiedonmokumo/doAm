import { auth } from '@/auth';
import { assertTaskProofEligible, submitTaskProof } from '@/lib/services/tasks';
import { storeTaskProof, removeTaskProof } from '@/lib/providers/proof-storage/cloudinary';
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
    uploaded = await storeTaskProof(file, id);
    const result = await submitTaskProof(session.user.id, id, uploaded);
    return Response.json(result);
  } catch (error) {
    if (uploaded) await removeTaskProof(uploaded.publicId).catch(() => undefined);
    return apiError('PROOF_SUBMISSION_FAILED', error instanceof Error ? error.message : 'Unable to submit proof.', 409);
  }
}
