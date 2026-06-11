/** Dev: rỗng = cùng origin (Vite proxy → backend :4000). Production: VITE_API_URL hoặc cùng origin Vercel. */
export function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  // Dev: dùng proxy Vite
  if (import.meta.env.DEV) return '';
  // Production Vercel: API trên cùng domain, không cần prefix
  return '';
}

/** Socket.io: undefined = kết nối tới host đang phục vụ trang (hợp proxy dev và Vercel). */
export function resolveSocketUrl(): string | undefined {
  const base = resolveApiBase();
  return base === '' ? undefined : base;
}
