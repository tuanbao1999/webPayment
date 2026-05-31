# Google Sheets API (Apps Script)

Dữ liệu app lưu trên **Google Sheet** — mở sheet là thấy bill, filter, export CSV.

## Cài đặt (15 phút)

### 1. Tạo Google Sheet

1. [sheets.new](https://sheets.new) → tạo spreadsheet mới
2. Copy **ID** từ URL:  
   `https://docs.google.com/spreadsheets/d/`**`SPREADSHEET_ID`**`/edit`

### 2. Apps Script

1. Trong Sheet: **Extensions** → **Apps Script**
2. Xóa code mặc định → dán nội dung file [`WebApp.gs`](./WebApp.gs)
3. **Project Settings** (bánh răng) → **Script properties** → Add:
   - `SPREADSHEET_ID` = ID vừa copy

### 3. Deploy Web App

1. **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (hoặc *Anyone with Google account* nếu muốn kín hơn)
5. **Deploy** → copy **Web app URL**  
   Dạng: `https://script.google.com/macros/s/...../exec`

### 4. Biến môi trường Netlify

| Biến | Giá trị | Secret |
|------|---------|--------|
| `GOOGLE_SCRIPT_URL` | URL web app ở bước 3 | Có |
| `NEXT_PUBLIC_GOOGLE_SHEET_URL` | Link mở sheet (tùy chọn) | Không |

Deploy lại site.

### 5. (Tùy chọn) Netlify Forms → Sheet

**Site configuration** → **Forms** → **Notifications** → **Outgoing webhook**:

- URL = `GOOGLE_SCRIPT_URL` (cùng URL Apps Script)

Hoặc form POST trực tiếp tới URL đó (Apps Script `doPost` nhận field Netlify Forms).

## Cấu trúc Sheet

Lần đầu gọi API, script chỉ **tạo tab + dòng tiêu đề** (không thêm dữ liệu mẫu). Bạn tự nhập người / mức giá / bộ hay đi qua app hoặc trực tiếp trên Sheet.

| Sheet | Cột (hàng 1) |
|-------|----------------|
| Nguoi | id, ten, active |
| BoHayDi | id, label |
| BoThanhVien | groupId, personId |
| MucGia | id, amount, label, isDefault |
| ChiTieu | id, ngay, moTa, tong, cheDoChia, boHayDi, submissionId, createdAt |
| ChiTiet | id, chiTieuId, personId, ten, soTien, daCK, paidAt |

## Cập nhật script

Sau khi sửa `WebApp.gs` (thêm xóa, v.v.): **Deploy → Manage deployments → Edit → New version** → Deploy.

## API actions (POST JSON)

```json
{ "action": "createExpense", "expenseDate": "2026-05-31", ... }
{ "action": "deletePerson", "id": "..." }
{ "action": "deleteFrequentGroup", "id": "..." }
{ "action": "deletePriceTier", "id": "..." }
{ "action": "addPriceTier", "amount": 50000, "label": "50k" }
```

GET: `?action=getPeople`, `?action=getExpensesByDate&date=2026-05-31`, …

App Next.js gọi các action này qua `GOOGLE_SCRIPT_URL`.
