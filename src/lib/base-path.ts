const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const normalizedBasePath =
  rawBasePath && rawBasePath !== "/" ? rawBasePath.replace(/\/+$/, "") : "";

export function withBasePath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBasePath}${normalizedPath}`;
}
