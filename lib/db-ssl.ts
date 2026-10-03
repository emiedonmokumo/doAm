import type { ConnectionOptions } from 'node:tls';

/**
 * Query parameters that node-postgres turns into an `ssl` config. Because `pg`
 * merges the parsed connection string *over* explicit options, leaving any of
 * these in DATABASE_URL silently replaces the `ssl` object we pass in code.
 */
const SSL_QUERY_PARAMS = [
  'ssl',
  'sslmode',
  'sslrootcert',
  'sslcert',
  'sslkey',
  'sslnegotiation',
  'uselibpqcompat',
] as const;

export function stripSslParams(connectionString: string): string {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  for (const param of SSL_QUERY_PARAMS) url.searchParams.delete(param);
  return url.toString();
}

/** Accepts multi-line PEM or single-line PEM with literal `\n` escapes. */
export function normalizeCaCertificate(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\\n/g, '\n').trim();
  return normalized ? normalized : undefined;
}

interface ResolveSslOptions {
  caCertificate: string | undefined;
  isProduction: boolean;
  isBuildPhase: boolean;
}

export function resolveSslConfig({
  caCertificate,
  isProduction,
  isBuildPhase,
}: ResolveSslOptions): ConnectionOptions {
  if (caCertificate) return { ca: caCertificate, rejectUnauthorized: true };

  if (isProduction && !isBuildPhase) {
    throw new Error('SUPABASE_CA_CERT must be configured in production to verify the database TLS connection.');
  }

  // Local development / build only: encrypted but unverified.
  return { rejectUnauthorized: false };
}
