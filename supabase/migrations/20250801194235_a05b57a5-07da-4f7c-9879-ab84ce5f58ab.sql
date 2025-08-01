-- Drop the existing policy
DROP POLICY "Users can view their own reports" ON public.saved_reports;

-- Create new policy that allows users to view their own reports OR admins to view all reports
CREATE POLICY "Users can view their own reports and admins can view all reports" 
ON public.saved_reports 
FOR SELECT 
USING (auth.uid() = user_id OR is_user_admin());