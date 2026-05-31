export function DbSetupGuide({ detail }: { detail?: string }) {
  return (
    <div className="card space-y-4" style={{ borderColor: "var(--warning)" }}>
      <h2 className="text-lg font-semibold">Cần cấu hình DATABASE_URL</h2>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Production dùng <strong>Netlify DB</strong> (PostgreSQL). Thêm biến môi trường trên Netlify.
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
          Netlify → <strong>Extensions</strong> → <strong>Neon</strong> / <strong>Netlify DB</strong> → lấy
          connection string <code>postgresql://...</code>
        </li>
        <li>
          <strong>Project configuration</strong> → <strong>Environment variables</strong>:
          <ul className="mt-1 list-disc pl-5">
            <li>
              <code>DATABASE_URL</code> = chuỗi PostgreSQL (có <code>?sslmode=require</code>)
            </li>
          </ul>
        </li>
        <li>
          Trên máy (một lần), tạo bảng:
          <pre className="mt-1 overflow-x-auto rounded p-2 text-xs" style={{ background: "var(--bg)" }}>
            {`$env:DATABASE_URL="postgresql://..."
npx prisma db push
npm run db:seed`}
          </pre>
        </li>
        <li>
          <strong>Deploys</strong> → <strong>Clear cache and deploy</strong>
        </li>
      </ol>
    </div>
  );
}
