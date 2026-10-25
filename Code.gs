/**
 * Jadwal Libur Bersama - backend Google Sheet (Google Apps Script)
 *
 * Cara pakai: lihat SETUP.md. Tempel seluruh isi file ini di
 * Extensions > Apps Script pada Google Sheet kamu, lalu Deploy sebagai Web app.
 *
 * Sheet "Libur"      : id | tanggal | nama | token | dibuat   (dibuat otomatis)
 * Sheet "Pengaturan" : batas_per_hari | batas_per_bulan       (bisa kamu ubah langsung)
 */

const SHEET_DATA = 'Libur';
const SHEET_CFG = 'Pengaturan';
const TZ = 'Asia/Jakarta';

function doGet() {
  return json_({ ok: true, config: getConfig_(), data: getAll_() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return json_({ ok: false, error: 'Server sedang sibuk, coba lagi sebentar.' });
  }
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'add') return json_(add_(body));
    if (body.action === 'remove') return json_(remove_(body));
    return json_({ ok: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return json_({ ok: false, error: 'Permintaan tidak valid.' });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- aksi ---------- */

function add_(b) {
  const nama = String(b.nama || '').trim().replace(/\s+/g, ' ');
  const tanggal = String(b.tanggal || '');
  const token = String(b.token || '');

  if (!nama || nama.length > 30) return fail_('Nama wajib diisi (maksimal 30 huruf).');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return fail_('Format tanggal tidak valid.');
  if (!token) return fail_('Token tidak ada.');
  if (tanggal < today_()) return fail_('Tanggal yang sudah lewat tidak bisa dipilih.');

  const cfg = getConfig_();
  const rows = getAll_();
  const key = nama.toLowerCase();

  const sameDay = rows.filter(r => r.tanggal === tanggal);
  if (sameDay.some(r => r.nama.toLowerCase() === key)) {
    return fail_('Kamu sudah libur di tanggal itu.');
  }
  if (sameDay.length >= cfg.perDay) {
    return fail_('Tanggal itu sudah penuh (' + cfg.perDay + ' orang). Pilih tanggal lain.');
  }
  const bulan = tanggal.slice(0, 7);
  const mine = rows.filter(r => r.nama.toLowerCase() === key && r.tanggal.slice(0, 7) === bulan);
  if (mine.length >= cfg.perMonth) {
    return fail_('Jatah libur bulan ini sudah habis (' + cfg.perMonth + ' hari).');
  }

  const id = Utilities.getUuid().slice(0, 8);
  sheet_(SHEET_DATA).appendRow([id, tanggal, nama, token, new Date()]);
  return { ok: true, id: id, config: cfg, data: getAll_() };
}

function remove_(b) {
  const id = String(b.id || '');
  const token = String(b.token || '');
  const sh = sheet_(SHEET_DATA);
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      if (String(values[i][3]) !== token) {
        return fail_('Hanya orang yang memilih tanggal ini yang bisa membatalkannya.');
      }
      sh.deleteRow(i + 1);
      return { ok: true, config: getConfig_(), data: getAll_() };
    }
  }
  return fail_('Data tidak ditemukan, mungkin sudah dihapus.');
}

/* ---------- data ---------- */

function getAll_() {
  const values = sheet_(SHEET_DATA).getDataRange().getValues();
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0] || !r[1]) continue;
    out.push({
      id: String(r[0]),
      tanggal: r[1] instanceof Date ? Utilities.formatDate(r[1], TZ, 'yyyy-MM-dd') : String(r[1]),
      nama: String(r[2])
    });
  }
  return out;
}

function getConfig_() {
  const sh = sheet_(SHEET_CFG);
  const perDay = parseInt(sh.getRange('A2').getValue(), 10);
  const perMonth = parseInt(sh.getRange('B2').getValue(), 10);
  return {
    perDay: perDay > 0 ? perDay : 2,
    perMonth: perMonth > 0 ? perMonth : 4
  };
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (sh) return sh;
  sh = ss.insertSheet(name);
  if (name === SHEET_DATA) {
    sh.appendRow(['id', 'tanggal', 'nama', 'token', 'dibuat']);
    sh.getRange('B:B').setNumberFormat('@'); // simpan tanggal sebagai teks yyyy-mm-dd
    sh.setFrozenRows(1);
  } else {
    sh.appendRow(['batas_per_hari', 'batas_per_bulan']);
    sh.appendRow([2, 4]);
  }
  return sh;
}

/* ---------- util ---------- */

function today_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function fail_(msg) {
  return { ok: false, error: msg };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
