export function SheetsSetupGuide({ detail }: { detail?: string }) {
  const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;

  return (
    <div className="card space-y-4" style={{ borderColor: "var(--warning)" }}>
      <h2 className="text-lg font-semibold">Cấu hình Google Sheets API</h2>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Dữ liệu lưu trên Google Sheet — không giới hạn 24h như Netlify DB. Xem file{" "}
        <code>google-apps-script/README.md</code> trong project.
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
        <li>Tạo Google Sheet → Apps Script → dán <code>WebApp.gs</code></li>
        <li>Script properties: <code>SPREADSHEET_ID</code></li>
        <li>Deploy Web app → copy URL</li>
        <li>
          Netlify env: <code>GOOGLE_SCRIPT_URL</code> = URL web app (secret)
        </li>
        <li>(Tùy chọn) <code>NEXT_PUBLIC_GOOGLE_SHEET_URL</code> = link mở sheet</li>
      </ol>
      {sheetUrl && (
        <a href={sheetUrl} target="_blank" rel="noreferrer" className="btn btn-primary inline-block">
          Mở Google Sheet
        </a>
      )}
    </div>
  );
}
