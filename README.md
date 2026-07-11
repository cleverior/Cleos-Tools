# Cleos Tools — Vexanium Block Producer Wallet Manager

CLI tool untuk mengelola wallet **Vexanium Block Producer** menggunakan binary `cleos`. Interaktif, color-coded, auto-install cleos, dan auto-detect wallet.

## Fitur

- **Create Wallet** — buat wallet baru, password otomatis tersimpan
- **Import Wallet** — import private key ke wallet
- **Unlock / Lock Wallet** — unlock satu atau semua wallet
- **Vote Block Producer** — vote BP untuk satu wallet atau semua wallet (bulk vote)
- **Define BP Mapping** — set target BP per wallet untuk vote all
- **Claim Reward** — klaim reward block producer
- **Wallet Info** — lihat status, key, dan voted BP dari semua wallet
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
2.  Import Existing Wallet
3.  Unlock Wallet
4.  Lock Wallet
5.  Vote Block Producer
6.  Vote All Wallets
7.  Claim Reward
8.  Wallet Info
9.  Define BP Mapping
10. Settings
11. Delete Wallet
12. Exit
```

## Struktur Folder

```
cleos-tools/
├── index.js                  # Entry point
├── config.json               # Persistent config
├── passwords/                # Wallet password files
├── activity.log              # Activity log (auto-generated)
├── src/
│   ├── config/index.js       # Config load/save
│   ├── services/
│   │   ├── cleos.service.js  # Check, install, exec cleos
│   │   ├── wallet.service.js # CRUD wallet, unlock/lock
│   │   ├── vote.service.js   # Vote BP
│   │   ├── reward.service.js # Claim reward
│   │   └── health.service.js # Broadcaster health check
│   ├── ui/
│   │   ├── header.js         # Banner + dashboard
│   │   └── menu.js           # Interactive menu
│   └── utils/
│       ├── logger.js         # Color-coded output
│       ├── validator.js      # Input validation
│       └── logfile.js        # Activity logging
└── package.json
```

## Settings

Semua konfigurasi disimpan di `config.json`:

- **Default Broadcaster Node** — contoh: `https://api.vexanium.com`
- **BP Mapping** — mapping wallet → target BP untuk vote all
- Persisten — tetap tersimpan setelah aplikasi ditutup

## License

MIT
