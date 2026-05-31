/**
 * Google Apps Script — Web App cho Quản lý chi tiêu
 *
 * Cài đặt:
 * 1. Tạo Google Sheet mới
 * 2. Extensions → Apps Script → dán file này
 * 3. Script properties: SPREADSHEET_ID = id từ URL sheet
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone (hoặc Anyone with Google account)
 * 5. Copy Web app URL → Netlify env GOOGLE_SCRIPT_URL
 */

const SHEETS = {
  NGUOI: "Nguoi",
  BO_HAY_DI: "BoHayDi",
  BO_THANH_VIEN: "BoThanhVien",
  MUC_GIA: "MucGia",
  CHI_TIEU: "ChiTieu",
  CHI_TIET: "ChiTiet",
};

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Thiếu SPREADSHEET_ID trong Script properties");
  return SpreadsheetApp.openById(id);
}

function ensureSheets_() {
  const ss = getSpreadsheet_();
  const names = Object.values(SHEETS);
  names.forEach(function (name) {
    if (!ss.getSheetByName(name)) {
      const sh = ss.insertSheet(name);
      if (name === SHEETS.NGUOI) sh.appendRow(["id", "ten", "active"]);
      if (name === SHEETS.BO_HAY_DI) sh.appendRow(["id", "label"]);
      if (name === SHEETS.BO_THANH_VIEN) sh.appendRow(["groupId", "personId"]);
      if (name === SHEETS.MUC_GIA) sh.appendRow(["id", "amount", "label", "isDefault"]);
      if (name === SHEETS.CHI_TIEU)
        sh.appendRow([
          "id",
          "ngay",
          "moTa",
          "tong",
          "cheDoChia",
          "boHayDi",
          "submissionId",
          "createdAt",
        ]);
      if (name === SHEETS.CHI_TIET)
        sh.appendRow(["id", "chiTieuId", "personId", "ten", "soTien", "daCK", "paidAt"]);
    }
  });
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function uid_() {
  return Utilities.getUuid().replace(/-/g, "").slice(0, 12);
}

function readSheet_(name) {
  const sh = getSpreadsheet_().getSheetByName(name);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(function (row) {
    const o = {};
    headers.forEach(function (h, i) {
      o[h] = row[i];
    });
    return o;
  });
}

function seedIfEmpty_() {
  ensureSheets_();
  const people = readSheet_(SHEETS.NGUOI);
  if (people.length > 0) return;

  const ss = getSpreadsheet_();
  const names = ["Lan", "An", "Bình", "Chi", "Dung", "Em", "Phúc", "Vy", "Hào"];
  const ids = names.map(function (n) {
    const id = uid_();
    ss.getSheetByName(SHEETS.NGUOI).appendRow([id, n, true]);
    return id;
  });

  const tiers = [
    [40000, "40k", false],
    [45000, "45k", false],
    [50000, "50k", true],
    [55000, "55k", false],
  ];
  tiers.forEach(function (t) {
    ss.getSheetByName(SHEETS.MUC_GIA).appendRow([uid_(), t[0], t[1], t[2]]);
  });

  const g1 = uid_();
  ss.getSheetByName(SHEETS.BO_HAY_DI).appendRow([g1, "5 đồng nghiệp hay đi cơm"]);
  ids.slice(0, 5).forEach(function (pid) {
    ss.getSheetByName(SHEETS.BO_THANH_VIEN).appendRow([g1, pid]);
  });

  const g2 = uid_();
  ss.getSheetByName(SHEETS.BO_HAY_DI).appendRow([g2, "Nhóm tối cuối tuần"]);
  [ids[1], ids[5], ids[6], ids[7], ids[8]].forEach(function (pid) {
    ss.getSheetByName(SHEETS.BO_THANH_VIEN).appendRow([g2, pid]);
  });
}

function doGet(e) {
  try {
    seedIfEmpty_();
    const action = (e.parameter.action || "ping").toString();
    const data = handleAction_(action, e.parameter);
    return jsonResponse_(data);
  } catch (err) {
    return jsonResponse_({ error: err.message || String(err) });
  }
}

function doPost(e) {
  try {
    seedIfEmpty_();
    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    const action = body.action || (e.parameter && e.parameter.action);
    if (!action) {
      return jsonResponse_(handleNetlifyForm_(e));
    }
    const data = handleAction_(action, body);
    return jsonResponse_(data);
  } catch (err) {
    return jsonResponse_({ error: err.message || String(err) });
  }
}

function handleNetlifyForm_(e) {
  const p = e.parameter || {};
  return handleAction_("createExpense", {
    expenseDate: p["expense-date"] || new Date().toISOString().slice(0, 10),
    description: p.description || "Chi tiêu",
    splitMode: p["split-mode"] || "tier",
    totalAmount: parseInt(p["total-amount"], 10) || 0,
    participants: (p.participants || "").split(",").map(function (s) {
      return s.trim();
    }),
    amountsJson: p["amounts-json"] ? JSON.parse(p["amounts-json"]) : {},
    frequentGroupLabel: p["frequent-group"] || "",
    submissionId: p["submission-id"] || uid_(),
  });
}

function handleAction_(action, params) {
  switch (action) {
    case "ping":
      return { ok: true };
    case "getPeople":
      return getPeople_();
    case "getFrequentGroups":
      return getFrequentGroups_();
    case "getPriceTiers":
      return getPriceTiers_();
    case "addPerson":
      return addPerson_(params.name);
    case "addFrequentGroup":
      return addFrequentGroup_(params.label, params.personIds || []);
    case "createExpense":
      return createExpense_(params);
    case "getExpensesByDate":
      return getExpensesByDate_(params.date);
    case "getExpense":
      return getExpense_(params.id);
    case "togglePaid":
      return togglePaid_(params.splitId, params.paid);
    case "getBalances":
      return getBalances_();
    default:
      throw new Error("Unknown action: " + action);
  }
}

function getPeople_() {
  return readSheet_(SHEETS.NGUOI)
    .filter(function (p) {
      return p.active !== false && p.active !== "FALSE" && p.active !== "";
    })
    .map(function (p) {
      return { id: String(p.id), name: String(p.ten), active: true };
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
}

function getPriceTiers_() {
  return readSheet_(SHEETS.MUC_GIA).map(function (t) {
    return {
      id: String(t.id),
      amount: Number(t.amount),
      label: String(t.label),
      isDefault: t.isDefault === true || t.isDefault === "TRUE",
    };
  });
}

function getFrequentGroups_() {
  const groups = readSheet_(SHEETS.BO_HAY_DI);
  const members = readSheet_(SHEETS.BO_THANH_VIEN);
  const people = readSheet_(SHEETS.NGUOI);
  const peopleMap = {};
  people.forEach(function (p) {
    peopleMap[p.id] = { id: String(p.id), name: String(p.ten) };
  });

  return groups.map(function (g) {
    return {
      id: String(g.id),
      label: String(g.label),
      members: members
        .filter(function (m) {
          return String(m.groupId) === String(g.id);
        })
        .map(function (m) {
          return {
            personId: String(m.personId),
            person: peopleMap[m.personId] || { id: String(m.personId), name: "?" },
          };
        }),
    };
  });
}

function addPerson_(name) {
  if (!name || !String(name).trim()) throw new Error("Nhập tên");
  const id = uid_();
  getSpreadsheet_()
    .getSheetByName(SHEETS.NGUOI)
    .appendRow([id, String(name).trim(), true]);
  return { id: id, name: String(name).trim(), active: true };
}

function addFrequentGroup_(label, personIds) {
  const id = uid_();
  const ss = getSpreadsheet_();
  ss.getSheetByName(SHEETS.BO_HAY_DI).appendRow([id, label]);
  (personIds || []).forEach(function (pid) {
    ss.getSheetByName(SHEETS.BO_THANH_VIEN).appendRow([id, pid]);
  });
  return getFrequentGroups_().find(function (g) {
    return g.id === id;
  });
}

function createExpense_(params) {
  const people = getPeople_();
  const nameToId = {};
  people.forEach(function (p) {
    nameToId[p.name] = p.id;
  });

  let participantIds = params.participantIds || [];
  if (params.participants && params.participants.length) {
    participantIds = params.participants
      .map(function (n) {
        return nameToId[n] || n;
      })
      .filter(Boolean);
  }

  const amounts = params.tierAmounts || params.amounts || [];
  const amountsMap = {};
  if (params.amountsJson && typeof params.amountsJson === "object") {
    Object.keys(params.amountsJson).forEach(function (k) {
      amountsMap[nameToId[k] || k] = Number(params.amountsJson[k]);
    });
  }
  amounts.forEach(function (a) {
    amountsMap[a.personId] = Number(a.amount);
  });

  if (params.submissionId) {
    const existing = readSheet_(SHEETS.CHI_TIEU).find(function (e) {
      return String(e.submissionId) === String(params.submissionId);
    });
    if (existing) return getExpense_(existing.id);
  }

  const expenseId = uid_();
  const ss = getSpreadsheet_();
  const ngay = params.expenseDate || new Date().toISOString().slice(0, 10);
  const tong = Number(params.totalAmount) || 0;

  ss.getSheetByName(SHEETS.CHI_TIEU).appendRow([
    expenseId,
    ngay,
    params.description || "Chi tiêu",
    tong,
    params.splitMode || "tier",
    params.frequentGroupLabel || "",
    params.submissionId || "",
    new Date().toISOString(),
  ]);

  participantIds.forEach(function (pid) {
    const person = people.find(function (p) {
      return p.id === pid;
    });
    const amt = amountsMap[pid] || 0;
    const splitId = uid_();
    ss.getSheetByName(SHEETS.CHI_TIET).appendRow([
      splitId,
      expenseId,
      pid,
      person ? person.name : pid,
      amt,
      false,
      "",
    ]);
  });

  return getExpense_(expenseId);
}

function buildExpenseFromRows_(expenseRow, details) {
  const splits = details.map(function (d) {
    return {
      id: String(d.id),
      amount: Number(d.soTien),
      person: { name: String(d.ten) },
      settlement: {
        paidAt: d.paidAt ? new Date(d.paidAt) : d.daCK === true || d.daCK === "TRUE" ? new Date() : null,
      },
    };
  });
  return {
    id: String(expenseRow.id),
    expenseDate: expenseRow.ngay,
    description: String(expenseRow.moTa),
    totalAmount: Number(expenseRow.tong),
    splitMode: String(expenseRow.cheDoChia),
    splits: splits,
    createdAt: expenseRow.createdAt,
  };
}

function getExpense_(id) {
  const expenses = readSheet_(SHEETS.CHI_TIEU);
  const details = readSheet_(SHEETS.CHI_TIET);
  const row = expenses.find(function (e) {
    return String(e.id) === String(id);
  });
  if (!row) return null;
  const det = details.filter(function (d) {
    return String(d.chiTieuId) === String(id);
  });
  return buildExpenseFromRows_(row, det);
}

function getExpensesByDate_(dateStr) {
  const expenses = readSheet_(SHEETS.CHI_TIEU);
  const details = readSheet_(SHEETS.CHI_TIET);
  const day = (dateStr || new Date().toISOString().slice(0, 10)).toString().slice(0, 10);

  return expenses
    .filter(function (e) {
      return String(e.ngay).slice(0, 10) === day;
    })
    .map(function (e) {
      const det = details.filter(function (d) {
        return String(d.chiTieuId) === String(e.id);
      });
      return buildExpenseFromRows_(e, det);
    })
    .reverse();
}

function togglePaid_(splitId, paid) {
  const sh = getSpreadsheet_().getSheetByName(SHEETS.CHI_TIET);
  const values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(splitId)) {
      sh.getRange(i + 1, 6).setValue(!!paid);
      sh.getRange(i + 1, 7).setValue(paid ? new Date().toISOString() : "");
      return { ok: true };
    }
  }
  throw new Error("Không tìm thấy");
}

function getBalances_() {
  const details = readSheet_(SHEETS.CHI_TIET);
  const map = {};
  details.forEach(function (d) {
    const key = String(d.ten);
    if (!map[key]) map[key] = { personId: String(d.personId), name: key, owed: 0, paid: 0 };
    map[key].owed += Number(d.soTien);
    if (d.daCK === true || d.daCK === "TRUE" || d.paidAt) map[key].paid += Number(d.soTien);
  });
  return Object.values(map)
    .map(function (p) {
      return { personId: p.personId, name: p.name, owed: p.owed, paid: p.paid, remaining: p.owed - p.paid };
    })
    .filter(function (p) {
      return p.remaining > 0;
    })
    .sort(function (a, b) {
      return b.remaining - a.remaining;
    });
}
