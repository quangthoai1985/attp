-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE facility_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE inspection_result AS ENUM ('passed', 'failed', 'pending');

-- 1. Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'staff',
    managed_area TEXT, -- Mã xã/phường/tỉnh mà user quản lý
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Facilities Table
CREATE TABLE public.facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    type TEXT NOT NULL, -- Loại hình: Ví dụ "Nhà hàng", "Bếp ăn", "Tạp hóa"
    province_code TEXT NOT NULL, -- Mã định danh địa bàn (xã/phường)
    status facility_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inspections Table
CREATE TABLE public.inspections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
    inspection_date DATE DEFAULT CURRENT_DATE,
    year INT NOT NULL,
    batch TEXT, -- Đợt kiểm tra
    result inspection_result DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Helper Function to get current user's role and area
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_area()
RETURNS TEXT AS $$
  SELECT managed_area FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies

-- Profiles: 
-- Admin xem hết. User xem của chính mình.
CREATE POLICY "Admin view all profiles" ON public.profiles
    FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "User view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Facilities:
-- Admin xem hết.
CREATE POLICY "Admin full access facilities" ON public.facilities
    FOR ALL USING (get_current_user_role() = 'admin');

-- Staff: Xem/Sửa cơ sở thuộc managed_area
CREATE POLICY "Staff view facilities in area" ON public.facilities
    FOR SELECT USING (
        get_current_user_role() = 'staff' 
        AND province_code = get_current_user_area()
    );

CREATE POLICY "Staff update facilities in area" ON public.facilities
    FOR UPDATE USING (
        get_current_user_role() = 'staff' 
        AND province_code = get_current_user_area()
    );

CREATE POLICY "Staff insert facilities in area" ON public.facilities
    FOR INSERT WITH CHECK (
        get_current_user_role() = 'staff' 
        AND province_code = get_current_user_area()
    );

-- Inspections:
-- Admin full access
CREATE POLICY "Admin full access inspections" ON public.inspections
    FOR ALL USING (get_current_user_role() = 'admin');

-- Staff: Truy cập thông qua facility relationship
CREATE POLICY "Staff access inspections in area" ON public.inspections
    FOR ALL USING (
        get_current_user_role() = 'staff' 
        AND EXISTS (
            SELECT 1 FROM public.facilities
            WHERE id = inspections.facility_id
            AND province_code = get_current_user_area()
        )
    );

-- Dashboard Helpers (Views/Functions)

-- View: Thống kê số lượng cơ sở theo xã/phường (province_code)
CREATE OR REPLACE VIEW public.dashboard_facilities_by_area AS
SELECT 
    province_code,
    COUNT(*) AS total_facilities,
    COUNT(*) FILTER (WHERE status = 'active') AS active_count
FROM public.facilities
GROUP BY province_code;

-- View: Thống kê theo loại hình
CREATE OR REPLACE VIEW public.dashboard_facilities_by_type AS
SELECT 
    type,
    COUNT(*) AS total
FROM public.facilities
GROUP BY type;

-- Function: Lấy tổng quan (cho Admin hoặc Staff - tự filter theo RLS nếu query trực tiếp bảng, 
-- nhưng function này dùng SECURITY DEFINER để bypass nếu cần, hoặc bỏ đi để dùng view với RLS).
-- Ở đây ta dùng View + RLS là đủ. PostgreSQL Views mặc định chạy với quyền của người gọi (invoker).

-- Trigger update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON public.facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
