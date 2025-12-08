-- Add Certificate Columns to Facilities
ALTER TABLE public.facilities 
ADD COLUMN is_certified BOOLEAN DEFAULT FALSE,
ADD COLUMN certificate_number TEXT,
ADD COLUMN certificate_date DATE,
ADD COLUMN certificate_expiry DATE;

-- Add Team Type to Inspections
CREATE TYPE team_type AS ENUM ('chuyen_nganh', 'lien_nganh');
ALTER TABLE public.inspections
ADD COLUMN team_type team_type DEFAULT 'chuyen_nganh';

-- Update Facility Status Enum if needed (existing seems fine)
-- Update Inspection Result Enum if needed (existing seems fine)
