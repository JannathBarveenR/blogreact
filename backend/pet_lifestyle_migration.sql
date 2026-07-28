-- Migration to add pet_lifestyle table
-- This allows storing dynamic survey answers (e.g. meals_per_day, walks_per_day) as JSONB.

CREATE TABLE public.pet_lifestyle (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pet_id uuid NOT NULL UNIQUE,
    answers jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pet_lifestyle_pkey PRIMARY KEY (id),
    CONSTRAINT pet_lifestyle_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pet_profiles(id) ON DELETE CASCADE
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.pet_lifestyle ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage lifestyle data for their own pets
CREATE POLICY "Users can manage their own pet's lifestyle"
ON public.pet_lifestyle
FOR ALL
USING (
  pet_id IN (SELECT id FROM public.pet_profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  pet_id IN (SELECT id FROM public.pet_profiles WHERE user_id = auth.uid())
);
