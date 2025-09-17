export function applyDepartmentToUrl(
  urlLike: string | undefined,
  department: string | null
): string | undefined {
  if (!urlLike) return urlLike;
  if (!department) return urlLike;

  try {
    // Absolute URL case
    const u = new URL(
      urlLike,
      typeof window !== "undefined" ? window.location.origin : "http://localhost"
    );

    const parts = u.pathname.split("/").filter(Boolean); // split & remove empty
    if (parts.length > 0) {
      const last = parts.pop(); // last segment (e.g., filename)
      if (last) {
        parts.push(department, last); // insert department before last
      } else {
        parts.push(department);
      }
    } else {
      parts.push(department);
    }

    u.pathname = "/" + parts.join("/");
    return u.toString();
  } catch {
    // Relative URL case
    const clean = urlLike.replace(/^\/+/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length > 0) {
      const last = parts.pop();
      if (last) {
        parts.push(department, last);
      } else {
        parts.push(department);
      }
    } else {
      parts.push(department);
    }
    return "/" + parts.join("/");
  }
}