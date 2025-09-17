export function applyDepartmentToUrl(urlLike: string | undefined, department: string | null): string | undefined {
  if (!urlLike) return urlLike;
  if (!department) return urlLike;
  try {
    // Absolute URL case
    const u = new URL(urlLike, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const cleanPath = u.pathname.replace(/^\/+/, "");
    u.pathname = `/${department}/${cleanPath}`;
    return u.toString();
  } catch {
    // Relative URL case
    const clean = urlLike.replace(/^\/+/, "");
    return `/${department}/${clean}`;
  }
}
