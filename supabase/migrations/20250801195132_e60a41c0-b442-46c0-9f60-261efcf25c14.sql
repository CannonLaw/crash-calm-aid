-- Update the profiles SELECT policy to allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile and admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_user_admin());