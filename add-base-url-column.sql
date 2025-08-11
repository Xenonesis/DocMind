-- Migration: Add base_url column to ai_provider_settings table
-- Run this in your Supabase SQL editor

-- Add the base_url column to the existing table
ALTER TABLE public.ai_provider_settings 
ADD COLUMN IF NOT EXISTS base_url TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ai_provider_settings'
ORDER BY ordinal_position;

-- Show current table structure
\d public.ai_provider_settings;