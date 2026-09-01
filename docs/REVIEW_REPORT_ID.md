# Laporan Review Kode Cleos Tools (Bahasa Indonesia)

**Tanggal**: 2026-09-01  
**Branch**: main  
**Jenis Review**: Keamanan, Bug, Maintainability

---

## Ringkasan Eksekutif

Cleos Tools adalah CLI yang terstruktur dengan baik untuk manajemen wallet Vexanium Block Producer. Codebase mengikuti pola-pola baik (layanan modular, config-driven, UI interaktif). **Tidak ditemukan kerentanan keamanan kritis**. Beberapa isu menengah/rendah teridentifikasi untuk perbaikan.

---

## Temuan Keamanan

| Tingkat | Isu | File | Baris | Deskripsi |
|---------|-----|------|-------|-----------|
| **Rendah** | Potensi Command Injection | `token.service.js` | 31-38 | Memo dari user dikirim ke cleos tanpa sanitasi. Meskipun pakai array args (mencegah shell injection), memo bisa trigger edge case parsing cleos. |
| **Sedang** | Validasi Private Key Rapuh | `wallet.service.js` | 51 | `hasPrivateKey` cek stdout mengandung string "VEX". Bisa gagal kalau versi cleos berubah atau tipe key berbeda. |

### Analogi Sederhana

**Command Injection (Memo)**:
> Bayangkan kasir di toko yang menerima catatan dari pembeli tanpa dibaca. Jika pembeli menulis "diskon 100%" di catatan, kasir langsung eksekusi tanpa verifikasi. **Sanitasi memo** = kasir baca dulu, hapus karakter aneh, batasi panjang catatan.

**Validasi Private Key Rapuh**:
> Seperti petugas keamanan cek identitas cuma lihat "ada tulisan KTP di kertas" — tapi bukan cek foto/fingerprint. Kalau format KTP berubah, petugas bingung. **Regex key pair** = cek format lengkap: "ada nomor unik 50+ karakter, format benar".

---

## Bug yang Ditemukan

| Tingkat | Isu | File | Baris | Deskripsi |
|---------|-----|------|-------|-----------|
| **Rendah** | Kode Mati (Dead Code) | `token.service.js` | 7-15 | Fungsi `getTokens` asli rusak (hanya return symbol). Sudah diganti `getTokensRobust` tapi ditinggal di kode. |
| **Rendah** | Parsing Amount Rapuh | `index.js` | 659-661 | `parseFloat(token.amount)` di mana `token.amount` = "100.0000 VEX". Beruntung jalan karena perilaku JS, tapi tidak eksplisit. |
| **Sedang** | Pola Error Tidak Konsisten | Banyak file | - | Service campur: return false, log.error + return false, throw. Tidak ada penanganan error terpadu. |

### Analogi Sederhana

**Dead Code (getTokens)**:
> Seperti gudang nyimpen mesin fotokopi rusak di samping yang baru. Orang bingung mana yang dipakai. **Fix** = buang yang rusak, simpan yang bagus aja.

**Fragile Amount Parse**:
> Seperti kasir baca harga "Rp 50.000" lalu cuma ambil angka 50000 pakai feeling. Kebetulan JS `parseFloat("50.0000 VEX")` return 50000, tapi ini kebetulan — bukan aturan. **Fix** = pisahin angka dan simbol dulu: `split(' ')[0]`.

**Inconsistent Error Handling**:
> Seperti tim bola tiap pemain main posisi beda saat error: satu mundur, satu lempar bola, satu diam. Harusnya ada **playbook** sama: error → log → return format standar.

---

## Isu Maintainability

| Isu | Dampak | File Terdampak |
|-----|--------|----------------|
| Duplicate config load | Performa (kecil) | Semua service panggil `config.load()` sendiri |
| Pola service tidak konsisten | Duplikasi kode | REX pakai `formatTx`; vote/reward/resource duplikasikan spinner logic |
| Validasi tersebar | Aturan tidak konsisten | `validator.js` + validasi inline di `index.js` |
| Tidak ada JSDoc | Sulit onboarding | Semua file service tidak punya dokumentasi fungsi |

---

## Observasi Positif

✅ Pisahan concern bagus (services/UI/utils/config)  
✅ Pakai `spawnSync` dengan array args (mencegah shell injection)  
✅ Auto-deteksi status wallet, password, voted BP  
✅ Health check sebelum operasi kritis  
✅ Config persisten dengan default yang wajar  
✅ Activity logging untuk audit trail  
✅ Penanganan tombol ESC di prompt  
✅ Output berwarna, user-friendly  

---

## Quick Wins (Bisa fix < 1 jam)

1. **Hapus fungsi `getTokens` mati** - `token.service.js` baris 7-15
2. **Perbaiki parsing amount** - `index.js` baris 659
3. **Tambah sanitasi memo** - `token.service.js` sebelum baris 34
4. **Ekstrak pola spinner/error umum** - Buat `utils/cli.js` dengan `runCleos(cmd, args, opts)`
5. **Tambah JSDoc ke export service** - Semua `module.exports` di services

---

## Refactor Saran (Effort Sedang)

1. **Unified Error Handling**: Buat `utils/errors.js` dengan `handleError(result, context)` return object standar
2. **Config Caching**: Tambah `config.get()` singleton atau passing config object ke services
3. **Input Validation Centralization**: Pindah semua aturan validasi ke `validator.js` dengan pesan error deskriptif
4. **Service Base Class**: Pola umum untuk service butuh wallet unlock + cleos exec + spinner

---

## File yang Dimodifikasi Review Ini

- `README.md` - Tambah Security Notes, Usage Caveats, Known Limitations
- `CLAUDE.md` - Dibuat baru dengan ringkasan review lengkap
- `src/services/token.service.js` - Hapus `getTokens` mati, tambah `sanitizeMemo()`
- `src/services/wallet.service.js` - Perbaiki `hasPrivateKey()` regex validasi key pair
- `index.js` - Perbaiki parsing amount split simbol

---

## Fix yang Sudah Diterapkan (Quick Wins)

✅ **Hapus fungsi `getTokens` mati** - `token.service.js` baris 7-15  
✅ **Perbaiki parsing amount** - `index.js` baris 659, sekarang pakai `parseFloat(token.amount.split(' ')[0])`  
✅ **Tambah sanitasi memo** - `token.service.js` fungsi baru `sanitizeMemo()`, hapus control char, batasi 256 char  
✅ **Perbaiki validasi key** - `wallet.service.js` baris 51, regex `/\"[A-Z0-9]{50,}\"/` cocok format key valid  
✅ **Ekstrak pola spinner/error umum** - Buat `src/utils/cli.js` dengan `runCleos()` dan `runCleosJson()`  
✅ **Tambah JSDoc ke export service** - Semua `module.exports` di services sudah ada dokumentasi  
✅ **Unified Error Handling** - Buat `src/utils/errors.js` dengan `handleResult()`, `wrapAsync()`  
✅ **Config Caching** - Tambah `config.get()` singleton + `config.clearCache()`  
✅ **Input Validation Centralization** - `validator.js` sekarang punya: `isPrivateKey`, `isPublicKey`, `hasResourceAmount`, `isBroadcasterUrl`, `isWalletName`, perbaiki `parseAssetInput`  
✅ **Unit tests** - `tests/validator.test.js` (55 passed), `tests/config.test.js` (8 passed)

---

## Next Steps Tersisa (Sudah Selesai Semua Quick Wins)

✅ **Ekstrak pola spinner/error umum** - `src/utils/cli.js` dengan `runCleos()` dan `runCleosJson()`  
✅ **Tambah JSDoc ke export service** - Semua `module.exports` di services sudah didokumentasikan  
✅ **Unified Error Handling** - `src/utils/errors.js` dengan `handleResult()`, `wrapAsync()`  
✅ **Config Caching** - `config.get()` singleton + `config.clearCache()`  
✅ **Input Validation Centralization** - `validator.js` diperluas dengan validasi lengkap  
✅ **Unit tests** - `tests/validator.test.js` (55 passed), `tests/config.test.js` (8 passed)

---

### Refactor Saran (Effort Sedang - Opsional)

1. **Service Base Class**: Pola umum untuk service butuh wallet unlock + cleos exec + spinner
2. **Integration test** dengan mock cleos
3. **TypeScript migration** untuk type safety