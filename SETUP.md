# Cara memasang Jadwal Libur Bersama

Ada 3 langkah. Total sekitar 10 menit, tanpa biaya.

## 1. Siapkan Google Sheet dan backend

1. Buka https://sheets.new lalu beri nama, misalnya "Jadwal Libur".
2. Klik **Extensions > Apps Script**.
3. Hapus isi editor, lalu tempel seluruh isi file `Code.gs`. Klik **Save**.
4. Klik **Deploy > New deployment**, pilih jenis **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Klik **Deploy**, izinkan akses saat diminta, lalu salin **Web app URL** (berakhiran `/exec`).

Sheet "Libur" dan "Pengaturan" dibuat otomatis saat website pertama kali dibuka.

## 2. Hubungkan website ke Sheet

Buka `index.html`, cari baris ini di bagian `<script>`:

```js
const API_URL = "";
```

Isi dengan URL tadi:

```js
const API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

## 3. Taruh website di internet

Pilih salah satu (semua gratis):

- **Netlify Drop**: buka https://app.netlify.com/drop lalu seret file `index.html`.
- **GitHub Pages**: upload `index.html` ke repository, aktifkan Pages di Settings.

Bagikan link-nya ke teman-teman.

## Mengatur aturan

Buka sheet **Pengaturan**, ubah angka di baris 2:

| batas_per_hari | batas_per_bulan |
|---|---|
| 2 | 4 |

- `batas_per_hari`: maksimal orang yang boleh libur di tanggal yang sama.
- `batas_per_bulan`: jatah libur tiap orang dalam satu bulan.

## Catatan

- Tiap orang bisa membatalkan liburnya sendiri dari browser yang dipakai saat memilih. Kalau data browser terhapus, hapus barisnya langsung di sheet **Libur**.
- Kalau kamu mengubah kode `Code.gs` nanti, pilih **Deploy > Manage deployments > Edit > New version** supaya perubahan berlaku.
- Sebelum `API_URL` diisi, website berjalan dalam mode contoh dan datanya hanya tersimpan di browser.
