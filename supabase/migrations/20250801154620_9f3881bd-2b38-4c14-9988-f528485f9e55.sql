-- Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = user_id_param),
    false
  );
$$;

-- Create RLS policy for admin-only access to admin_notifications
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.admin_notifications;

CREATE POLICY "Only admins can view admin notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (public.is_user_admin());

CREATE POLICY "Only admins can insert admin notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (public.is_user_admin());

CREATE POLICY "Only admins can update admin notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (public.is_user_admin());

CREATE POLICY "Only admins can delete admin notifications" 
ON public.admin_notifications 
FOR DELETE 
USING (public.is_user_admin());