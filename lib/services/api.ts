export function apiError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
