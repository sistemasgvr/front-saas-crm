/** URL base del backend NestJS — leída en runtime (no cachear en constante de módulo). */
export function getApiUrl(): string {
  const url = process.env.API_URL?.trim();
  if (url) return url.replace(/\/$/, '');

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'API_URL no está configurada en el servidor. En Hostinger: Environment variables → API_URL=https://tu-dominio-back/api → Redeploy.',
    );
  }

  return 'http://localhost:4000/api';
}
