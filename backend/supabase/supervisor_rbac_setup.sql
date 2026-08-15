-- ============================================================================
-- SUPERVISOR & RBAC SETUP SQL
-- Non-destructive configuration of Row Level Security (RLS) policies
-- and Supervisor administrative RPC functions for Supabase.
-- ============================================================================

-- 1. Helper function: Get roles of a user
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(array_agg(role), ARRAY['pet_owner']::text[])
    FROM public.user_roles
    WHERE user_id = p_user_id;
$$;

-- 2. Helper function: Check if user is Supervisor / Admin
CREATE OR REPLACE FUNCTION public.is_supervisor(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role = 'supervisor'
    );
$$;

-- 3. Helper function: Check if user is Vet / Doctor
CREATE OR REPLACE FUNCTION public.is_vet(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role = 'vet'
    );
$$;

-- 4. Supervisor Admin Function: Assign or Update Role
CREATE OR REPLACE FUNCTION public.assign_user_role(
    p_target_user_id uuid,
    p_role text,
    p_assigned_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure caller is a supervisor
    IF NOT public.is_supervisor(p_assigned_by) THEN
        RAISE EXCEPTION 'Access Denied: Only supervisors can assign user roles.';
    END IF;

    -- Validate role value
    IF p_role NOT IN ('pet_owner', 'vet', 'supervisor', 'staff') THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;

    -- Upsert role
    INSERT INTO public.user_roles (user_id, role, assigned_by, created_at, updated_at)
    VALUES (p_target_user_id, p_role, p_assigned_by, now(), now())
    ON CONFLICT (user_id, role) DO UPDATE
    SET updated_at = now();

    RETURN true;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR ALL ROLES
-- ============================================================================

-- RLS: user_roles
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR public.is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors can manage user roles" ON public.user_roles;
CREATE POLICY "Supervisors can manage user roles"
ON public.user_roles FOR ALL
USING (public.is_supervisor(auth.uid()))
WITH CHECK (public.is_supervisor(auth.uid()));

-- RLS: vet_profiles
DROP POLICY IF EXISTS "Public can view active verified vet profiles" ON public.vet_profiles;
CREATE POLICY "Public can view active verified vet profiles"
ON public.vet_profiles FOR SELECT
USING (is_active = true OR user_id = auth.uid() OR public.is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Vets can update their own profile" ON public.vet_profiles;
CREATE POLICY "Vets can update their own profile"
ON public.vet_profiles FOR UPDATE
USING (user_id = auth.uid() OR public.is_supervisor(auth.uid()));

DROP POLICY IF EXISTS "Supervisors can manage all vet profiles" ON public.vet_profiles;
CREATE POLICY "Supervisors can manage all vet profiles"
ON public.vet_profiles FOR ALL
USING (public.is_supervisor(auth.uid()));

-- RLS: online_consultations
DROP POLICY IF EXISTS "Pet owners can access their own online consultations" ON public.online_consultations;
CREATE POLICY "Pet owners can access their own online consultations"
ON public.online_consultations FOR ALL
USING (
    user_id = auth.uid() 
    OR vet_id IN (SELECT id FROM public.vet_profiles WHERE user_id = auth.uid())
    OR public.is_supervisor(auth.uid())
)
WITH CHECK (
    user_id = auth.uid() 
    OR vet_id IN (SELECT id FROM public.vet_profiles WHERE user_id = auth.uid())
    OR public.is_supervisor(auth.uid())
);

-- RLS: maternity_records
DROP POLICY IF EXISTS "Pet owners and assigned vets can access maternity records" ON public.maternity_records;
CREATE POLICY "Pet owners and assigned vets can access maternity records"
ON public.maternity_records FOR ALL
USING (
    user_id = auth.uid()
    OR attending_vet_id IN (SELECT id FROM public.vet_profiles WHERE user_id = auth.uid())
    OR public.is_supervisor(auth.uid())
)
WITH CHECK (
    user_id = auth.uid()
    OR attending_vet_id IN (SELECT id FROM public.vet_profiles WHERE user_id = auth.uid())
    OR public.is_supervisor(auth.uid())
);

-- RLS: maternity_milestones
DROP POLICY IF EXISTS "Access maternity milestones via record ownership" ON public.maternity_milestones;
CREATE POLICY "Access maternity milestones via record ownership"
ON public.maternity_milestones FOR ALL
USING (
    maternity_record_id IN (
        SELECT id FROM public.maternity_records 
        WHERE user_id = auth.uid() 
        OR attending_vet_id IN (SELECT id FROM public.vet_profiles WHERE user_id = auth.uid())
        OR public.is_supervisor(auth.uid())
    )
);
