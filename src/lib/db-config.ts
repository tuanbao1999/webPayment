export function isCloudDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("libsql://") || url.startsWith("https://");
}

export function usesLocalSqliteFile(): boolean {
  return (process.env.DATABASE_URL ?? "").startsWith("file:");
}
