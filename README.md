# ⚡ YANZKHENZ — Auto Order VPS Indonesia

Platform auto order VPS Indonesia dengan QRIS Auto Payment, Backend Express.js + MongoDB Atlas.

---

## 🚀 Fitur

- ✅ Web utama tanpa login (public)
- ✅ Admin panel dengan session auth
- ✅ QRIS Auto Payment (polling otomatis)
- ✅ Dashboard realtime + chart
- ✅ Search & filter order
- ✅ MongoDB Atlas (cloud permanent)
- ✅ Responsive HP & PC
- ✅ Glassmorphism dark blue UI
- ✅ Deploy-ready Render

---

## 📁 Struktur Project

```
yanzkhenz/
├── server.js              # Entry point Express
├── package.json
├── .env.example           # Template environment
├── .env                   # (jangan di-push ke GitHub!)
├── models/
│   └── Order.js           # MongoDB schema
├── routes/
│   ├── api.js             # API endpoints
│   └── admin.js           # Admin routes
├── middleware/
│   └── auth.js            # Session auth
├── views/
│   ├── index.ejs          # Halaman toko utama
│   ├── 404.ejs
│   └── admin/
│       ├── layout.ejs
│       ├── login.ejs
│       ├── dashboard.ejs
│       └── orders.ejs
└── public/
    ├── css/
    │   ├── main.css
    │   └── admin.css
    └── js/
        ├── main.js
        └── admin.js
```

---

## ⚙️ Setup Lokal

### 1. Clone & Install

```bash
git clone https://github.com/username/yanzkhenz.git
cd yanzkhenz
npm install
```

### 2. Buat file `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/yanzkhenz
SESSION_SECRET=ganti_dengan_string_random_panjang
API_KEY=fp_ydegb5yqu1mviogtu
API_BASE_URL=https://felixpedia.orderhostid.my.id/api
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yanz123
NODE_ENV=development
```

### 3. Jalankan

```bash
npm run dev   # development (nodemon)
npm start     # production
```

Buka: `http://localhost:3000`

---

## 🍃 Setup MongoDB Atlas

1. Buka [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Buat akun gratis → **Create Project**
3. **Build a Database** → pilih **M0 FREE**
4. Pilih region terdekat → **Create**
5. Buat username & password database → **Create User**
6. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
7. Klik **Connect** → **Compass / Drivers** → salin connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/yanzkhenz
   ```
8. Ganti `<password>` dengan password yang dibuat → tempel ke `MONGO_URI` di `.env`

---

## 🚀 Deploy ke Render

### Step 1 — Push ke GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/username/yanzkhenz.git
git push -u origin main
```

> ⚠️ Pastikan `.env` ada di `.gitignore`!

### Step 2 — Buat Web Service di Render

1. Buka [https://render.com](https://render.com) → Sign up / Login
2. Klik **New** → **Web Service**
3. Connect GitHub → pilih repo `yanzkhenz`
4. Isi pengaturan:
   - **Name**: `yanzkhenz`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Step 3 — Tambah Environment Variables di Render

Klik tab **Environment** → **Add Environment Variable**:

| Key | Value |
|-----|-------|
| `MONGO_URI` | `mongodb+srv://...` |
| `SESSION_SECRET` | `random_string_panjang_aman` |
| `API_KEY` | `fp_ydegb5yqu1mviogtu` |
| `API_BASE_URL` | `https://felixpedia.orderhostid.my.id/api` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `yanz123` |
| `NODE_ENV` | `production` |

### Step 4 — Deploy

Klik **Create Web Service** → tunggu build selesai (~2-3 menit).

URL akan jadi: `https://yanzkhenz.onrender.com`

---

## 🔐 Admin Panel

- URL: `https://yourdomain.com/admin/login`
- Username: `admin`
- Password: `yanz123`

> ⚠️ Ganti password di `.env` sebelum deploy!

---

## 💳 API QRIS

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/order/create` | POST | Buat order + generate QR |
| `/api/payment/check` | POST | Cek status pembayaran |
| `/api/balance` | GET | Cek saldo API |
| `/api/order/:id` | GET | Detail order |

---

## 📝 Lisensi

MIT License — Free to use & modify.

Made with ❤️ by **YANZKHENZ**
