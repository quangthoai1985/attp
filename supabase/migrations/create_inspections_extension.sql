-- Migration: Extend inspections table for detailed inspection management
-- Created: 2025-12-10
-- UPDATED: Fixed team_type enum casting issue

-- Step 1: Create new result enum type
DO $$ BEGIN
    CREATE TYPE inspection_result_new AS ENUM ('dat', 'cho_khac_phuc', 'da_khac_phuc', 'khong_dat');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns to inspections table
ALTER TABLE inspections 
ADD COLUMN IF NOT EXISTS remediation_deadline DATE,
ADD COLUMN IF NOT EXISTS has_penalty BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS penalty_agency TEXT,
ADD COLUMN IF NOT EXISTS sanction_type TEXT;

-- Step 3: Migrate existing result values to new enum
-- Add temporary column with new type
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS result_new inspection_result_new;

-- Map old values to new values
UPDATE inspections SET result_new = 
    CASE 
        WHEN result::text = 'passed' THEN 'dat'::inspection_result_new
        WHEN result::text = 'failed' THEN 'khong_dat'::inspection_result_new
        WHEN result::text = 'pending' THEN 'cho_khac_phuc'::inspection_result_new
        ELSE 'dat'::inspection_result_new
    END
WHERE result_new IS NULL;

-- Step 4: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inspections_facility_year ON inspections(facility_id, year);
CREATE INDEX IF NOT EXISTS idx_inspections_remediation_deadline ON inspections(remediation_deadline) WHERE remediation_deadline IS NOT NULL;

-- Step 5: Add RLS policies for inspections if not exists
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
DO $$ BEGIN
    CREATE POLICY "Allow read for authenticated users" ON inspections
        FOR SELECT
        TO authenticated
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Allow insert/update/delete for admins only
DO $$ BEGIN
    CREATE POLICY "Allow all for admins" ON inspections
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comments
COMMENT ON TABLE inspections IS 'Lịch sử thanh kiểm tra cơ sở ATTP';
COMMENT ON COLUMN inspections.remediation_deadline IS 'Thời hạn khắc phục (chỉ áp dụng khi result = cho_khac_phuc)';
COMMENT ON COLUMN inspections.has_penalty IS 'Có xử phạt hay không';
COMMENT ON COLUMN inspections.penalty_amount IS 'Số tiền xử phạt (VND)';
COMMENT ON COLUMN inspections.penalty_agency IS 'Cơ quan xử phạt';
COMMENT ON COLUMN inspections.sanction_type IS 'Hình thức chế tài';

-- =============================================
-- MANUAL STEPS - Run these one by one after the above succeeds:
-- =============================================

-- Step A: Finalize result column migration
-- ALTER TABLE inspections DROP COLUMN IF EXISTS result;
-- ALTER TABLE inspections RENAME COLUMN result_new TO result;
-- ALTER TABLE inspections ALTER COLUMN result SET DEFAULT 'dat'::inspection_result_new;

-- Step B: Update team_type if needed (only run if team_type is TEXT, not ENUM)
-- If team_type is already an ENUM, skip this step
-- UPDATE inspections SET team_type = 'chuyen_nganh' WHERE team_type::text = 'specialized';
-- UPDATE inspections SET team_type = 'lien_nganh' WHERE team_type::text = 'interdisciplinary';
