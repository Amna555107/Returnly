-- ============================================================
--  Returnly — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Items table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title          TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('Pets','Phone','Wallet','Bag','Keys','Documents','Other')),
  description    TEXT,
  image_url      TEXT,
  area           TEXT NOT NULL,          -- neighbourhood / district only — NEVER a full address
  item_date      DATE NOT NULL,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('email','phone','whatsapp')),
  contact_value  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','returned')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS items_type_idx       ON public.items (type);
CREATE INDEX IF NOT EXISTS items_category_idx   ON public.items (category);
CREATE INDEX IF NOT EXISTS items_area_idx       ON public.items (area);
CREATE INDEX IF NOT EXISTS items_user_id_idx    ON public.items (user_id);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items (created_at DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Everyone (including anon visitors) can read all items
CREATE POLICY "Anyone can view items"
  ON public.items FOR SELECT
  USING (true);

-- Only authenticated users can insert; they become the owner
CREATE POLICY "Authenticated users can post items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their own items
CREATE POLICY "Owners can update their items"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only the owner can delete their own items
CREATE POLICY "Owners can delete their items"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);

-- ── Storage bucket ────────────────────────────────────────────
-- Create the bucket in Dashboard → Storage, or run:
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view photos
CREATE POLICY "Public photo access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-photos');

-- Authenticated users can upload photos
CREATE POLICY "Auth users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'item-photos' AND auth.role() = 'authenticated');

-- Owners can delete their photos
CREATE POLICY "Owners can delete their photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
