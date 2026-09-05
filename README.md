# Cleos Tools — Vexanium Block Producer Wallet Manager

CLI tool untuk mengelola wallet **Vexanium Block Producer** menggunakan binary `cleos`. Interaktif, color-coded, auto-install cleos, dan auto-detect wallet.

## Fitur

- **Create Wallet** — buat wallet baru, password otomatis tersimpan
- **Open Existing Wallet** — buka semua file `*.wallet` dari `~/vex-wallet/`
- **Import Wallet** — import private key ke wallet
- **Unlock / Lock Wallet** — unlock satu atau semua wallet
- **Vote Block Producer** — vote BP untuk satu wallet atau semua wallet (bulk vote)
- **Define BP Mapping** — set target BP per wallet untuk vote all
- **Claim Reward** — klaim reward block producer
- **VEX REX** — unstake to REX, sell REX, withdraw REX fund, cek maturity, cek saldo withdrawable
- **Stake/Unstake Resource** — delegate/undelegate NET & CPU bandwidth, cek staked balance, cek & klaim refund unstake
- **Send Token** — transfer VEX/token dengan memo validation (wajib untuk Indodax)
- **Wallet Info** — lihat status, key, dan voted BP dari semua wallet
- **Broadcaster Nodes** — tambah, hapus, dan pilih node aktif
- **Restart Keosd** — restart + bersihkan semua wallet & password
- **Auto Install Cleos** — jika `cleos` belum terinstall, download & install otomatis
- **Auto Detect** — deteksi wallet, status lock/unlock, password file, dan voted BP dari chain
- **Broadcaster Health Check** — cek koneksi node sebelum transaksi
- **Persistent Config** — semua setting tersimpan di `config.json`

## Prerequisites

- Ubuntu 22.04+
- Node.js 20+
- `sudo` akses (untuk auto-install cleos)

## Install

```bash
git clone <repo-url>
cd cleos-tools
npm install
```

## Usage

```bash
npm start
# atau
node index.js
```

## Menu

```
1.  Create Wallet
2.  Open Existing Wallet
3.  Import Existing Wallet
4.  Unlock Wallet
5.  Lock Wallet
6.  Vote Block Producer
7.  Vote All Wallets
8.  Claim Reward
9.  Wallet Info
10. Define BP Mapping
11. Broadcaster Nodes
12. VEX REX
13. Stake/Unstake Resource
14. Send Token
15. Restart Keosd
16. Delete Wallet
17. Exit
```

### Stake/Unstake Resource Submenu (Opsi 13)

```
1.  Stake Resource (CPU/NET)
2.  Unstake Resource (CPU/NET)
3.  Cek Stake Resource
4.  Cek Status Unstake (Refund 3 Hari)
5.  Claim Refund
6.  Kembali
```

## Stake/Unstake Resource

Menu **Stake/Unstake Resource** (opsi 13) menyediakan:

- **Stake Resource** — delegate NET/CPU ke account lain
  - Input otomatis format ke 4 desimal (contoh: `25` → `25.0000 VEX`, `25.001` → `25.0010 VEX`)
  - Default 0.0000 VEX jika kosong
  - Bisa stake hanya NET atau hanya CPU (salah satu boleh 0)
  - Verifikasi nominal sebelum eksekusi

- **Unstake Resource** — undelegate NET/CPU dari account lain
  - Validasi input sama dengan stake
  - Verifikasi nominal sebelum eksekusi

- **Cek Staked Resources** — tampilkan total NET & CPU yang distake (akumulasi semua delegasi)

- **Cek Status Unstake (Refund 3 Hari)** — cek status refund unstake
  - Menampilkan dana yang **belum bisa claim** (kurang dari 72 jam / 3 hari)
  - Menampilkan dana yang **siap claim** (sudah lewat 72 jam / 3 hari)
  - Detail: NET, CPU, total, waktu request, jam yang sudah lewat
  - Setelah 3 hari: dana bisa diklaim lewat menu **Claim Refund**

- **Claim Refund** — klaim dana unstake yang sudah lewat 3 hari / 72 jam
  - Eksekusi `vexcore::refund` (Vexanium tak punya `system claimrefund` EOSIO-style)
  - Ditempuh manual, dana tidak otomatis cair setelah 3 hari

## VEX REX

Menu **VEX REX** (opsi 12) menyediakan:

- **Unstake to REX** — pindahkan stake ke REX
- **Sell REX** — jual token REX
- **Withdraw REX Fund** — tarik dana dari REX fund
- **Cek Maturity** — lihat REX yang sudah matured
- **Cek Withdrawable** — lihat saldo yang bisa di-withdraw

## Broadcaster Nodes

Default node: **https://vexascan.com:8443**

List node Vexanium yang bisa digunakan bisa dilihat di:
https://scan.arcelio.xyz/node-monitor

Menu Broadcaster Nodes menyediakan opsi untuk:
- Menambah node baru
- Menghapus node
- Memilih node aktif (digunakan untuk transaksi)

## Struktur Folder

```
cleos-tools/
├── index.js                  # Entry point
├── config.json               # Persistent config
├── passwords/                # Wallet password files
├── activity.log              # Activity log (auto-generated)
├── docs/                     # Documentation
├── tests/                    # Unit tests
├── src/
│   ├── config/index.js       # Config load/save (singleton cache)
│   ├── services/
│   │   ├── cleos.service.js  # Check, install, exec cleos
│   │   ├── wallet.service.js # CRUD wallet, unlock/lock
│   │   ├── vote.service.js   # Vote BP
│   │   ├── reward.service.js # Claim reward
│   │   ├── rex.service.js    # REX actions + checks
│   │   ├── resourceAllocation.service.js # Stake/Unstake NET/CPU
│   │   ├── token.service.js  # Token transfer + memo sanitize
│   │   └── health.service.js # Broadcaster health check
│   ├── ui/
│   │   ├── header.js         # Banner + dashboard
│   │   └── menu.js           # Interactive menu
│   └── utils/
│       ├── cli.js            # Shared cleos execution pattern
│       ├── errors.js         # Unified error handling
│       ├── logger.js         # Color-coded output
│       ├── validator.js      # Input validation
│       └── logfile.js        # Activity logging
└── package.json
```

## Konfigurasi

Semua konfigurasi disimpan di `config.json`:

- **Default Broadcaster Node** — default: `https://vexascan.com:8443`
- **Broadcasters** — daftar node yang tersimpan
- **BP Mapping** — mapping wallet → target BP untuk vote all
- Persisten — tetap tersimpan setelah aplikasi ditutup

## Testing

```bash
# Run unit tests
node tests/validator.test.js
node tests/config.test.js
```

## Security Notes

- Memo sanitization: control characters stripped, max 256 chars
- Private key validation: regex-based key pair format check
- cleos executed via spawnSync with array args (no shell injection)
- Input validation centralized in validator.js

## License

MIT