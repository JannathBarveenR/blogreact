-- Migration: Create feedbacks table with RLS and Indexes
-- Run this script in your Supabase SQL Editor

-- 1. Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON public.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedbacks;
CREATE POLICY "Users can view their own feedback" 
    ON public.feedbacks FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedbacks;
CREATE POLICY "Users can insert their own feedback" 
    ON public.feedbacks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedbacks;
CREATE POLICY "Users can update their own feedback" 
    ON public.feedbacks FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedbacks;
CREATE POLICY "Users can delete their own feedback" 
    ON public.feedbacks FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_feedbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feedbacks_updated_at ON public.feedbacks;
CREATE TRIGGER trg_feedbacks_updated_at
    BEFORE UPDATE ON public.feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION update_feedbacks_updated_at();
