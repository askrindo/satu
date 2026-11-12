-- ========================================================
-- ASKRINDO SATU (Sistem Aplikasi Terpadu)
-- Supabase PostgreSQL Database Schema & Seed Data
-- ========================================================

-- 1. TABEL PENGGUNA (users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    nip TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT 'password123',
    role TEXT NOT NULL,
    division TEXT,
    branch TEXT,
    avatar TEXT,
    allowed_apps TEXT[] DEFAULT ARRAY['kabar']::TEXT[],
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    last_login TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. TABEL PERMOHONAN PENUTUPAN ASURANSI (sppa_records)
CREATE TABLE IF NOT EXISTS public.sppa_records (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    insured_name TEXT NOT NULL,
    insured_type TEXT NOT NULL,
    nik_npwp TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    product_type TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    risk_location TEXT,
    total_tsi NUMERIC NOT NULL DEFAULT 0,
    estimated_premium NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Underwriting Review',
    registered_by TEXT,
    branch TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TABEL AUDIT TRAIL (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    user_name TEXT NOT NULL,
    role TEXT,
    sub_app TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. TABEL PENGATURAN SISTEM (system_settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'config',
    app_name TEXT DEFAULT 'Askrindo SATU',
    company_name TEXT DEFAULT 'PT Asuransi Kredit Indonesia',
    member_of TEXT DEFAULT 'Indonesia Financial Group (IFG)',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    notification_banner TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ========================================================
-- KEAMANAN: Row Level Security (RLS) & Akses Anon/Public
-- Mengizinkan aplikasi web Askrindo SATU membaca dan menulis data
-- ========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sppa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk public/anon access
DROP POLICY IF EXISTS "Allow public all access on users" ON public.users;
CREATE POLICY "Allow public all access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on sppa_records" ON public.sppa_records;
CREATE POLICY "Allow public all access on sppa_records" ON public.sppa_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public all access on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on system_settings" ON public.system_settings;
CREATE POLICY "Allow public all access on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- SEED DATA AWAL (Pengguna & Data SPPA Bawaan Askrindo SATU)
-- ========================================================
INSERT INTO public.users (id, nip, name, email, password, role, division, branch, avatar, allowed_apps, status)
VALUES
('USR-001', '19850101', 'Ahmad Faisal, S.E., M.M.', 'admin.satu@askrindo.co.id', 'password123', 'Super Administrator', 'Divisi Teknologi Informasi & Digitalisasi', 'Kantor Pusat - Jakarta', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', ARRAY['kabar', 'ttk', 'bus', 'pelaku', 'admin'], 'active'),
('USR-002', '19900315', 'Budi Santoso, AAIJ', 'budi.santoso@askrindo.co.id', 'password123', 'Senior Underwriter', 'Divisi Underwriting & Penjaminan Non-Bank', 'Kantor Cabang Utama Jakarta Gambir', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', ARRAY['kabar', 'bus', 'pelaku'], 'active'),
('USR-003', '19940722', 'Siti Rahmawati, S.E.', 'siti.rahma@askrindo.co.id', 'password123', 'Account Officer KUR & UMKM', 'Divisi Penjaminan Perbankan & Program KUR', 'Kantor Cabang Surabaya', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', ARRAY['ttk', 'pelaku'], 'active'),
('USR-004', '19971105', 'Dian Permana, S.Kom.', 'dian.permana@askrindo.co.id', 'password123', 'Marketing & Relationship Officer', 'Divisi Pemasaran Korporasi & Broker', 'Kantor Cabang Medan', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', ARRAY['kabar', 'bus'], 'active'),
('USR-005', '20010910', 'Rizky Pratama', 'rizky.pratama@askrindo.co.id', 'password123', 'Staff Operasional (Junior)', 'Divisi Pelayanan & Operasional Cabang', 'Kantor Cabang Bandung', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&q=80', ARRAY['kabar'], 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sppa_records (id, date, insured_name, insured_type, nik_npwp, phone, email, address, product_type, period_start, period_end, risk_location, total_tsi, estimated_premium, status, registered_by, branch)
VALUES
('SPPA-2026-0081', '2026-11-10', 'PT Maju Bersama Sejahtera', 'Badan Usaha (PT)', '01.234.567.8-012.000', '0812-8899-7711', 'finance@majubersama.co.id', 'Kawasan Industri Pulogadung Blok B No. 14, Jakarta Timur', 'Asuransi Kebakaran & Property All Risks (PAR)', '2026-12-01', '2027-12-01', 'Gudang & Kantor Utama - Jakarta Timur', 18500000000, 28450000, 'Approved', 'Budi Santoso, AAIJ', 'Kantor Cabang Utama Jakarta Gambir'),
('SPPA-2026-0082', '2026-11-11', 'CV Sumber Rejeki Abadi', 'Badan Usaha (CV)', '02.987.654.3-045.000', '0813-4455-6677', 'cv.sumberrejeki@gmail.com', 'Jl. Rungkut Industri Raya No. 88, Surabaya', 'Penjaminan Proyek (Surety Bond - Jaminan Pelaksanaan)', '2026-11-15', '2027-05-15', 'Proyek Pembangunan Gedung Balai Diklat Jawa Timur', 3500000000, 10500000, 'Underwriting Review', 'Siti Rahmawati, S.E.', 'Kantor Cabang Surabaya'),
('SPPA-2026-0083', '2026-11-12', 'H. Suwandi (Toko Kain Berkah)', 'Perorangan', '3174091508750002', '0856-1122-3344', 'suwandi.berkah@yahoo.co.id', 'Pasar Tanah Abang Blok A Lt. 2 Los B No. 45, Jakarta Pusat', 'Asuransi Kebakaran Standar Indonesia (FLEXAS)', '2026-11-15', '2027-11-15', 'Kios Pertokoan Tanah Abang, Jakarta Pusat', 850000000, 1870000, 'Pending Submission', 'Dian Permana, S.Kom.', 'Kantor Cabang Utama Jakarta Gambir')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_logs (id, timestamp, user_name, role, sub_app, action, details)
VALUES
('LOG-1001', '2026-11-12 09:35:10+00', 'Ahmad Faisal, S.E., M.M.', 'Super Administrator', 'ADMIN', 'Konfigurasi Hak Akses', 'Memperbarui hak akses aplikasi untuk user Rizky Pratama (NIP 20010910)'),
('LOG-1002', '2026-11-12 09:12:44+00', 'Budi Santoso, AAIJ', 'Senior Underwriter', 'KABAR', 'Simulasi Premi Kebakaran', 'Melakukan kalkulasi tarif kebakaran okupasi Industri Garmen TSI Rp 12.000.000.000'),
('LOG-1003', '2026-11-12 08:45:20+00', 'Siti Rahmawati, S.E.', 'Account Officer KUR', 'TTK', 'Simulasi Angsuran KUR', 'Simulasi KUR Mikro Rp 50.000.000 tenor 36 bulan suku bunga subsidi 6%')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.system_settings (id, app_name, company_name, member_of, maintenance_mode, notification_banner)
VALUES
('config', 'Askrindo SATU', 'PT Asuransi Kredit Indonesia (Askrindo)', 'Indonesia Financial Group (IFG)', FALSE, 'Portal Terpadu Askrindo SATU kini terhubung ke Cloud Database Supabase secara real-time.')
ON CONFLICT (id) DO UPDATE SET
    notification_banner = EXCLUDED.notification_banner,
    updated_at = NOW();
