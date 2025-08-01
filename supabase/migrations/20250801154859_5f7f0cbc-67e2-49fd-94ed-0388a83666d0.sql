-- Fix the search_path security issue for the is_user_admin function
DROP FUNCTION IF EXISTS public.is_user_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = user_id_param),
    false
  );
$$;