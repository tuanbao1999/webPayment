export function isPostgresDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

export function usesLocalSqliteFile(): boolean {
  return (process.env.DATABASE_URL ?? "").startsWith("file:");
}

export function isCloudDatabase(): boolean {
  return isPostgresDatabase() || (process.env.DATABASE_URL ?? "").startsWith("libsql://");
}
