export function normalizeApiOrigin(value = '') {
  const raw = value.trim().replace(/\/+$/, '').replace(/\/api$/i, '');
  if (!raw) return '';
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('VITE_API_URL must be an HTTP(S) backend origin, without credentials or a path.');
  }
  return url.origin;
}

export function resolveApiUrl(origin, path = '') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`;
}
