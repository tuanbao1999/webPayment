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

function doGet(e) {
  try {
    ensureSheets_();
    const action = (e.parameter.action || "ping").toString();
    const data = handleAction_(action, e.parameter);
    return jsonResponse_(data);
  } catch (err) {
    return jsonResponse_({ error: err.message || String(err) });
  }
}

function doPost(e) {
  try {
    ensureSheets_();
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
    case "deletePerson":
      return deletePerson_(params.id);
    case "addFrequentGroup":
      return addFrequentGroup_(params.label, params.personIds || []);
    case "deleteFrequentGroup":
      return deleteFrequentGroup_(params.id);
    case "addPriceTier":
      return addPriceTier_(params.amount, params.label, params.isDefault);
    case "deletePriceTier":
      return deletePriceTier_(params.id);
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
    case "getDebtsSummary":
      return getDebtsSummary_();
    case "getPersonHistory":
      return getPersonHistory_(params.personId);
    case "filterExpenses":
      return filterExpenses_(params);
    case "getMonthlyStats":
      return getMonthlyStats_(params.month);
    case "updateExpense":
      return updateExpense_(params);
    case "deleteExpense":
      return deleteExpense_(params.id);
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

/** Xóa dòng theo cột id (cột A), từ dưới lên để không lệch index */
function deleteRowById_(sheetName, id) {
  const sh = getSpreadsheet_().getSheetByName(sheetName);
  const values = sh.getDataRange().getValues();
  var deleted = 0;
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) {
      sh.deleteRow(i + 1);
      deleted++;
    }
  }
  return deleted;
}

/** Xóa các dòng có values[i][colIndex] === value */
function deleteRowsByField_(sheetName, colIndex, value) {
  const sh = getSpreadsheet_().getSheetByName(sheetName);
  const values = sh.getDataRange().getValues();
  var deleted = 0;
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][colIndex]) === String(value)) {
      sh.deleteRow(i + 1);
      deleted++;
    }
  }
  return deleted;
}

function addPerson_(name) {
  if (!name || !String(name).trim()) throw new Error("Nhập tên");
  const id = uid_();
  getSpreadsheet_()
    .getSheetByName(SHEETS.NGUOI)
    .appendRow([id, String(name).trim(), true]);
  return { id: id, name: String(name).trim(), active: true };
}

function deletePerson_(id) {
  if (!id) throw new Error("Thiếu id");
  deleteRowsByField_(SHEETS.BO_THANH_VIEN, 1, id);
  var n = deleteRowById_(SHEETS.NGUOI, id);
  if (n === 0) throw new Error("Không tìm thấy người");
  return { ok: true };
}

function addPriceTier_(amount, label, isDefault) {
  var amt = Number(amount);
  if (!amt || amt <= 0) throw new Error("Số tiền không hợp lệ");
  if (isDefault) {
    const sh = getSpreadsheet_().getSheetByName(SHEETS.MUC_GIA);
    const values = sh.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      sh.getRange(i + 1, 4).setValue(false);
    }
  }
  const id = uid_();
  const lbl = label || Math.round(amt / 1000) + "k";
  getSpreadsheet_()
    .getSheetByName(SHEETS.MUC_GIA)
    .appendRow([id, amt, lbl, !!isDefault]);
  return { id: id, amount: amt, label: lbl, isDefault: !!isDefault };
}

function deletePriceTier_(id) {
  if (!id) throw new Error("Thiếu id");
  var n = deleteRowById_(SHEETS.MUC_GIA, id);
  if (n === 0) throw new Error("Không tìm thấy mức giá");
  return { ok: true };
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

function deleteFrequentGroup_(id) {
  if (!id) throw new Error("Thiếu id");
  deleteRowsByField_(SHEETS.BO_THANH_VIEN, 0, id);
  var n = deleteRowById_(SHEETS.BO_HAY_DI, id);
  if (n === 0) throw new Error("Không tìm thấy bộ");
  return { ok: true };
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
      person: { id: String(d.personId), name: String(d.ten) },
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

function isPaid_(d) {
  return d.daCK === true || d.daCK === "TRUE" || !!d.paidAt;
}

function getAllExpenses_() {
  const expenses = readSheet_(SHEETS.CHI_TIEU);
  const details = readSheet_(SHEETS.CHI_TIET);
  return expenses
    .map(function (e) {
      const det = details.filter(function (d) {
        return String(d.chiTieuId) === String(e.id);
      });
      return buildExpenseFromRows_(e, det);
    })
    .sort(function (a, b) {
      return String(b.expenseDate).localeCompare(String(a.expenseDate));
    });
}

function getBalances_() {
  return getDebtsSummary_().people
    .filter(function (p) {
      return p.remaining > 0;
    })
    .map(function (p) {
      return {
        personId: p.personId,
        name: p.name,
        owed: p.totalOwed,
        paid: p.totalPaid,
        remaining: p.remaining,
      };
    });
}

function getDebtsSummary_() {
  const expenses = readSheet_(SHEETS.CHI_TIEU);
  const details = readSheet_(SHEETS.CHI_TIET);
  const expMap = {};
  expenses.forEach(function (e) {
    expMap[String(e.id)] = e;
  });

  const map = {};
  details.forEach(function (d) {
    const pid = String(d.personId);
    if (!map[pid]) {
      map[pid] = {
        personId: pid,
        name: String(d.ten),
        totalOwed: 0,
        totalPaid: 0,
        remaining: 0,
        unpaidItems: [],
      };
    }
    const amt = Number(d.soTien);
    map[pid].totalOwed += amt;
    if (isPaid_(d)) {
      map[pid].totalPaid += amt;
    } else {
      map[pid].remaining += amt;
      const exp = expMap[String(d.chiTieuId)];
      map[pid].unpaidItems.push({
        splitId: String(d.id),
        expenseId: String(d.chiTieuId),
        amount: amt,
        description: exp ? String(exp.moTa) : "",
        date: exp ? String(exp.ngay).slice(0, 10) : "",
      });
    }
  });

  const people = Object.values(map).sort(function (a, b) {
    return b.remaining - a.remaining;
  });
  const totalRemaining = people.reduce(function (s, p) {
    return s + p.remaining;
  }, 0);

  return { people: people, totalRemaining: totalRemaining };
}

function getPersonHistory_(personId) {
  if (!personId) throw new Error("Thiếu personId");
  const details = readSheet_(SHEETS.CHI_TIET).filter(function (d) {
    return String(d.personId) === String(personId);
  });
  const expenses = readSheet_(SHEETS.CHI_TIEU);
  const expMap = {};
  expenses.forEach(function (e) {
    expMap[String(e.id)] = e;
  });

  const items = details.map(function (d) {
    const exp = expMap[String(d.chiTieuId)];
    return {
      splitId: String(d.id),
      amount: Number(d.soTien),
      paid: isPaid_(d),
      paidAt: d.paidAt ? String(d.paidAt) : null,
      expense: exp
        ? {
            id: String(exp.id),
            expenseDate: String(exp.ngay).slice(0, 10),
            description: String(exp.moTa),
            totalAmount: Number(exp.tong),
          }
        : null,
    };
  });

  items.sort(function (a, b) {
    const da = a.expense ? a.expense.expenseDate : "";
    const db = b.expense ? b.expense.expenseDate : "";
    return db.localeCompare(da);
  });

  const totalOwed = items.reduce(function (s, i) {
    return s + i.amount;
  }, 0);
  const totalPaid = items
    .filter(function (i) {
      return i.paid;
    })
    .reduce(function (s, i) {
      return s + i.amount;
    }, 0);

  const person = getPeople_().find(function (p) {
    return p.id === String(personId);
  });

  return {
    person: person || { id: String(personId), name: details[0] ? String(details[0].ten) : "?" },
    totalOwed: totalOwed,
    totalPaid: totalPaid,
    remaining: totalOwed - totalPaid,
    items: items,
  };
}

function filterExpenses_(params) {
  var list = getAllExpenses_();

  if (params.dateFrom) {
    list = list.filter(function (e) {
      return String(e.expenseDate).slice(0, 10) >= String(params.dateFrom);
    });
  }
  if (params.dateTo) {
    list = list.filter(function (e) {
      return String(e.expenseDate).slice(0, 10) <= String(params.dateTo);
    });
  }
  if (params.personId) {
    list = list
      .map(function (e) {
        return {
          id: e.id,
          expenseDate: e.expenseDate,
          description: e.description,
          totalAmount: e.totalAmount,
          splitMode: e.splitMode,
          splits: e.splits.filter(function (s) {
            return s.person && String(s.person.id) === String(params.personId);
          }),
          createdAt: e.createdAt,
        };
      })
      .filter(function (e) {
        return e.splits.length > 0;
      });
  }
  if (params.status === "unpaid") {
    list = list.filter(function (e) {
      return e.splits.some(function (s) {
        return !s.settlement || !s.settlement.paidAt;
      });
    });
  } else if (params.status === "paid") {
    list = list.filter(function (e) {
      return (
        e.splits.length > 0 &&
        e.splits.every(function (s) {
          return s.settlement && s.settlement.paidAt;
        })
      );
    });
  }

  return list;
}

function getMonthlyStats_(monthStr) {
  const month = (monthStr || new Date().toISOString().slice(0, 7)).toString();
  const expenses = readSheet_(SHEETS.CHI_TIEU).filter(function (e) {
    return String(e.ngay).slice(0, 7) === month;
  });
  const details = readSheet_(SHEETS.CHI_TIET);
  const expIds = {};
  expenses.forEach(function (e) {
    expIds[String(e.id)] = e;
  });

  const totalSpent = expenses.reduce(function (s, e) {
    return s + Number(e.tong);
  }, 0);

  var unpaidTotal = 0;
  details.forEach(function (d) {
    if (expIds[String(d.chiTieuId)] && !isPaid_(d)) {
      unpaidTotal += Number(d.soTien);
    }
  });

  const personCount = {};
  details.forEach(function (d) {
    if (!expIds[String(d.chiTieuId)]) return;
    const name = String(d.ten);
    personCount[name] = (personCount[name] || 0) + 1;
  });
  const byPerson = Object.keys(personCount)
    .map(function (name) {
      return { name: name, count: personCount[name] };
    })
    .sort(function (a, b) {
      return b.count - a.count;
    });

  const topExpenses = expenses
    .map(function (e) {
      return {
        id: String(e.id),
        description: String(e.moTa),
        date: String(e.ngay).slice(0, 10),
        amount: Number(e.tong),
      };
    })
    .sort(function (a, b) {
      return b.amount - a.amount;
    })
    .slice(0, 5);

  return {
    month: month,
    totalSpent: totalSpent,
    expenseCount: expenses.length,
    unpaidTotal: unpaidTotal,
    byPerson: byPerson,
    topExpenses: topExpenses,
  };
}

function updateExpenseRow_(id, ngay, moTa, tong, cheDoChia, boHayDi) {
  const sh = getSpreadsheet_().getSheetByName(SHEETS.CHI_TIEU);
  const values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sh.getRange(i + 1, 2, i + 1, 6).setValues([[ngay, moTa, tong, cheDoChia, boHayDi || ""]]);
      return;
    }
  }
  throw new Error("Không tìm thấy bill");
}

function deleteExpense_(id) {
  if (!id) throw new Error("Thiếu id");
  deleteRowsByField_(SHEETS.CHI_TIET, 1, id);
  var n = deleteRowById_(SHEETS.CHI_TIEU, id);
  if (n === 0) throw new Error("Không tìm thấy bill");
  return { ok: true };
}

function updateExpense_(params) {
  const id = params.id;
  if (!id) throw new Error("Thiếu id");

  const people = getPeople_();
  const participantIds = params.participantIds || [];
  const amounts = params.tierAmounts || [];
  const amountsMap = {};
  amounts.forEach(function (a) {
    amountsMap[a.personId] = Number(a.amount);
  });

  var tong = Number(params.totalAmount) || 0;
  if (!tong) {
    participantIds.forEach(function (pid) {
      tong += amountsMap[pid] || 0;
    });
  }

  updateExpenseRow_(
    id,
    params.expenseDate || new Date().toISOString().slice(0, 10),
    params.description || "Chi tiêu",
    tong,
    params.splitMode || "tier",
    params.frequentGroupLabel || ""
  );

  deleteRowsByField_(SHEETS.CHI_TIET, 1, id);
  const ss = getSpreadsheet_();
  participantIds.forEach(function (pid) {
    const person = people.find(function (p) {
      return p.id === pid;
    });
    const splitId = uid_();
    ss.getSheetByName(SHEETS.CHI_TIET).appendRow([
      splitId,
      id,
      pid,
      person ? person.name : pid,
      amountsMap[pid] || 0,
      false,
      "",
    ]);
  });

  return getExpense_(id);
}
