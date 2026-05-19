/** Dev: rỗng = cùng origin (Vite proxy → backend :4000). Production: VITE_API_URL hoặc fallback. */
export function resolveApiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  if (import.meta.env.DEV) return '';
  return 'http://localhost:4000';
}

/** Socket.io: undefined = kết nối tới host đang phục vụ trang (hợp proxy dev). */
export function resolveSocketUrl(): string | undefined {
  const base = resolveApiBase();
  return base === '' ? undefined : base;
}
