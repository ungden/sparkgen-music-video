-- Pending migration: Run this in Supabase SQL Editor
-- Project: zpkgilumvkmmhswfctcc

-- Add character prompt and art style to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS character_prompt TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS art_style TEXT;

-- Add video_url to scenes
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create storage bucket for media (images, audio, videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media');
