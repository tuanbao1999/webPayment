export function DbSetupGuide({ detail }: { detail?: string }) {
  return (
    <div className="card space-y-4" style={{ borderColor: "var(--warning)" }}>
      <h2 className="text-lg font-semibold">Cần cấu hình database trên Netlify</h2>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        SQLite file chỉ chạy trên máy local. Site production cần{" "}
        <strong>Turso</strong> (miễn phí).
      </p>
      {detail && (
        <pre
          className="overflow-x-auto rounded p-2 text-xs"
          style={{ background: "var(--bg)", color: "#f87171" }}
        >
          {detail}
        </pre>
      )}
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>
          Đăng ký{" "}
          <a href="https://turso.tech" target="_blank" rel="noreferrer">
            turso.tech
          </a>{" "}
          → tạo database
        </li>
        <li>
          Copy <strong>Database URL</strong> (<code>libsql://...</code>) và{" "}
          <strong>Auth Token</strong>
        </li>
        <li>
          Netlify → <strong>Project configuration</strong> →{" "}
          <strong>Environment variables</strong> → thêm:
          <ul className="mt-1 list-disc pl-5">
            <li>
              <code>DATABASE_URL</code> = libsql://...
            </li>
            <li>
              <code>TURSO_AUTH_TOKEN</code> = token
            </li>
          </ul>
        </li>
        <li>
          Trên máy (một lần), tạo bảng:
          <pre className="mt-1 overflow-x-auto rounded p-2 text-xs" style={{ background: "var(--bg)" }}>
            {`set DATABASE_URL=libsql://...
set TURSO_AUTH_TOKEN=...
npx prisma db push
npm run db:seed`}
          </pre>
        </li>
        <li>
          Netlify → <strong>Deploys</strong> → <strong>Trigger deploy</strong>
        </li>
      </ol>
    </div>
  );
}
