-- Migration: Create facility_types table
-- Description: Tạo bảng để quản lý loại hình cơ sở ATTP

-- Tạo bảng facility_types
CREATE TABLE IF NOT EXISTS public.facility_types (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Thêm cột owner_name vào bảng facilities (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'facilities' 
        AND column_name = 'owner_name'
    ) THEN
        ALTER TABLE public.facilities ADD COLUMN owner_name text;
    END IF;
END $$;

-- Thêm dữ liệu mẫu cho facility_types
INSERT INTO public.facility_types (name) VALUES 
    ('Nhà hàng'),
    ('Bếp ăn tập thể'),
    ('Cơ sở sản xuất'),
    ('Tạp hóa'),
    ('Quán ăn đường phố')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.facility_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Cho phép đọc facility_types" ON public.facility_types;
DROP POLICY IF EXISTS "Admin có thể quản lý facility_types" ON public.facility_types;

-- Policy cho phép tất cả user đọc
CREATE POLICY "Cho phép đọc facility_types" ON public.facility_types
    FOR SELECT USING (true);

-- Policy cho admin có thể thêm/sửa/xóa
CREATE POLICY "Admin có thể quản lý facility_types" ON public.facility_types
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_facility_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS facility_types_updated_at ON public.facility_types;
CREATE TRIGGER facility_types_updated_at
    BEFORE UPDATE ON public.facility_types
    FOR EACH ROW
    EXECUTE FUNCTION update_facility_types_updated_at();
