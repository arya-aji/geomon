# GEOMON - Sistem Geospasial Monitoring Wilkerstat

Sistem monitoring geospasial untuk Wilayah Kerja Statistik (Wilkerstat) BPS Kota Jakarta Pusat.

## Tentang GEOMON

GEOMON adalah aplikasi web berbasis geospasial yang dirancang khusus untuk membantu BPS Kota Jakarta Pusat dalam memantau dan mengelola data statistik wilayah kerja secara visual dan interaktif.

## Fitur Utama

- 🗺️ **Pemetaan Geospasial** - Visualisasi data statistik pada peta interaktif
- 📊 **Dashboard Monitoring** - Analisis data real-time untuk Wilkerstat
- 🏢 **Manajemen Wilayah** - Pengelolaan batas dan data wilayah kerja
- 📱 **Responsive Design** - Aksesibel di berbagai perangkat
- 🌙 **Dark Mode** - Mode tampilan yang nyaman untuk penggunaan berkelanjutan

## Teknologi

- **Framework:** Next.js 15 dengan App Router
- **Bahasa:** TypeScript
- **Database:** PostgreSQL dengan NeonDB
- **ORM:** Drizzle ORM
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Better Auth

## Prasyarat

- Node.js 18+
- Akun NeonDB untuk database cloud

## Instalasi

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd geomon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Konfigurasi database NeonDB Anda di file `.env`

4. **Jalankan development server**
   ```bash
   npm run dev
   ```

5. **Buka [http://localhost:3000](http://localhost:3000)**

## Konfigurasi Database

Pastikan file `.env` sudah dikonfigurasi dengan benar:

```env
# Database NeonDB
DATABASE_URL='postgresql://username:password@host/database?sslmode=require'
POSTGRES_DB=nama_database
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# Authentication
BETTER_AUTH_SECRET=secret_key_anda
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

## Perintah Development

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run db:push` - Push schema ke database
- `npm run db:studio` - Buka Drizzle Studio

## Struktur Project

```
geomon/
├── app/                    # Halaman Next.js
├── components/             # Komponen React
│   └── ui/                # Komponen UI shadcn
├── db/                    # Konfigurasi database
├── lib/                   # Utility functions
└── public/                # Static assets
```

## Deployment

Untuk deployment production, pastikan:

1. Environment variables sudah dikonfigurasi dengan benar
2. Database NeonDB sudah siap untuk production
3. Build aplikasi dengan `npm run build`

## Lisensi

© 2025 BPS Kota Jakarta Pusat
