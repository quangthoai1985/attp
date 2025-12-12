-- Migration: Add coordinates to facilities table
-- Run this in Supabase SQL Editor

-- Add latitude and longitude columns
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT 10.7066,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 105.1169;

-- Add comment for documentation
COMMENT ON COLUMN facilities.latitude IS 'Vĩ độ của cơ sở trên bản đồ';
COMMENT ON COLUMN facilities.longitude IS 'Kinh độ của cơ sở trên bản đồ';
